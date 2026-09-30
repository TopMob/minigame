// Физический и логический движок Танчиков (Battle City / Top-Down Tanks Engine)

import {
  Direction,
  TileType,
  TankType,
  PowerupType,
  Difficulty,
  DIFFICULTY_CONFIG,
  GRID_SIZE,
  TILE_SIZE,
  MAP_SIZE,
  TANK_SIZE,
  BULLET_SIZE,
  Tank,
  Bullet,
  Powerup,
  Particle,
  TrackMark,
  FloatingText,
  TanksState,
} from './types'
import {
  generateStageGrid,
  updateBaseWalls,
  BASE_TILES,
  ENEMY_SPAWN_TILES,
  PLAYER_SPAWN_TILE,
} from './maps'

export interface SoundCallbacks {
  onShoot?: () => void
  onHit?: () => void
  onBrickHit?: () => void
  onExplosion?: (isBig?: boolean) => void
  onPowerup?: () => void
  onBaseDestroy?: () => void
}

// Вспомогательные функции для работы с направлениями
export function getDirectionVector(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'up':
      return { dx: 0, dy: -1 }
    case 'down':
      return { dx: 0, dy: 1 }
    case 'left':
      return { dx: -1, dy: 0 }
    case 'right':
      return { dx: 1, dy: 0 }
  }
}

// Создание нового танка игрока
export function createPlayerTank(tier: number = 1): Tank {
  return {
    id: 'player',
    x: PLAYER_SPAWN_TILE.x * TILE_SIZE,
    y: PLAYER_SPAWN_TILE.y * TILE_SIZE,
    dir: 'up',
    speed: 1.8 + (tier > 1 ? 0.3 : 0),
    type: 'player',
    hp: tier === 4 ? 2 : 1,
    maxHp: tier === 4 ? 2 : 1,
    isPlayer: true,
    tier,
    isFlashingBonus: false,
    shootCooldown: 0,
    shieldTimer: 180, // 3 секунды неуязвимости при рождении
    trackTimer: 0,
    slideX: 0,
    slideY: 0,
  }
}

// Создание вражеского танка
export function createEnemyTank(
  id: string,
  spawnIdx: number,
  type: TankType,
  isFlashingBonus: boolean,
  difficulty: Difficulty
): Tank {
  const spawnTile = ENEMY_SPAWN_TILES[spawnIdx % ENEMY_SPAWN_TILES.length]
  const config = DIFFICULTY_CONFIG[difficulty]

  let hp = 1
  let speed = config.enemyBaseSpeed

  if (type === 'scout') {
    speed *= 1.45
  } else if (type === 'light') {
    speed *= 1.2
  } else if (type === 'assault') {
    speed *= 1.05
  } else if (type === 'heavy') {
    hp = 3
    speed *= 0.85
  }

  return {
    id,
    x: spawnTile.x * TILE_SIZE,
    y: spawnTile.y * TILE_SIZE,
    dir: 'down',
    speed,
    type,
    hp,
    maxHp: hp,
    isPlayer: false,
    tier: 1,
    isFlashingBonus,
    shootCooldown: Math.floor(Math.random() * 60) + 30,
    shieldTimer: 0,
    trackTimer: 0,
    slideX: 0,
    slideY: 0,
  }
}

// Проверка пересечения двух AABB прямоугольников
function checkOverlap(
  r1: { x: number; y: number; w: number; h: number },
  r2: { x: number; y: number; w: number; h: number }
): boolean {
  return (
    r1.x < r2.x + r2.w &&
    r1.x + r1.w > r2.x &&
    r1.y < r2.y + r2.h &&
    r1.y + r1.h > r2.y
  )
}

// Является ли тайл твердым для танка
function isTileSolidForTank(tile: number): boolean {
  return (
    tile === TileType.BRICK ||
    tile === TileType.STEEL ||
    tile === TileType.WATER ||
    tile === TileType.BASE ||
    tile === TileType.BASE_DESTROYED
  )
}

// Проверка столкновения танка с тайловой картой с автодоворотом (corner rounding)
export function moveTankWithCollision(
  tank: Tank,
  dx: number,
  dy: number,
  grid: number[][],
  otherTanks: Tank[]
): { x: number; y: number } {
  let targetX = tank.x + dx
  let targetY = tank.y + dy

  // Ограничение границами поля
  targetX = Math.max(0, Math.min(MAP_SIZE - TANK_SIZE, targetX))
  targetY = Math.max(0, Math.min(MAP_SIZE - TANK_SIZE, targetY))

  // Помощь в повороте (Corner sliding assist):
  // Если движемся вертикально, плавно выравниваемся по ближайшей сетке TILE_SIZE по X
  if (dy !== 0 && dx === 0) {
    const snapMod = targetX % TILE_SIZE
    if (snapMod > 0 && snapMod <= 6) {
      targetX -= Math.min(1.2, snapMod)
    } else if (snapMod >= TILE_SIZE - 6) {
      targetX += Math.min(1.2, TILE_SIZE - snapMod)
    }
  } else if (dx !== 0 && dy === 0) {
    const snapMod = targetY % TILE_SIZE
    if (snapMod > 0 && snapMod <= 6) {
      targetY -= Math.min(1.2, snapMod)
    } else if (snapMod >= TILE_SIZE - 6) {
      targetY += Math.min(1.2, TILE_SIZE - snapMod)
    }
  }

  // Проверка столкновения с тайлами
  const testBox = { x: targetX, y: targetY, w: TANK_SIZE, h: TANK_SIZE }
  const startCol = Math.floor(testBox.x / TILE_SIZE)
  const endCol = Math.floor((testBox.x + testBox.w - 0.1) / TILE_SIZE)
  const startRow = Math.floor(testBox.y / TILE_SIZE)
  const endRow = Math.floor((testBox.y + testBox.h - 0.1) / TILE_SIZE)

  let collided = false
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
        collided = true
        break
      }
      if (isTileSolidForTank(grid[r][c])) {
        collided = true
        break
      }
    }
    if (collided) break
  }

  // Столкновение с другими танками
  if (!collided) {
    for (const other of otherTanks) {
      if (other.id === tank.id) continue
      if (
        checkOverlap(testBox, {
          x: other.x,
          y: other.y,
          w: TANK_SIZE,
          h: TANK_SIZE,
        })
      ) {
        collided = true
        break
      }
    }
  }

  if (collided) {
    return { x: tank.x, y: tank.y }
  }

  return { x: targetX, y: targetY }
}

// Создание начального состояния игры
export function createInitialTanksState(
  difficulty: Difficulty = 'medium',
  stage: number = 1,
  currentScore: number = 0,
  highScore: number = 0
): TanksState {
  const config = DIFFICULTY_CONFIG[difficulty]
  const grid = generateStageGrid(stage)
  const player = createPlayerTank(1)

  return {
    difficulty,
    stage,
    score: currentScore,
    highScore,
    lives: config.lives,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    stageCleared: false,
    baseDestroyed: false,
    enemiesRemaining: config.totalEnemies,
    enemySpawnTimer: 30, // первый спавн быстро
    freezeTimer: 0,
    shovelTimer: 0,
    screenShake: 0,
    player,
    enemies: [],
    bullets: [],
    powerups: [],
    particles: [],
    trackMarks: [],
    floatingTexts: [],
    grid,
    enemyTanksDestroyed: {
      scout: 0,
      light: 0,
      assault: 0,
      heavy: 0,
    },
  }
}

// Генерация взрывных частиц
export function createExplosionParticles(
  particles: Particle[],
  x: number,
  y: number,
  isBig: boolean = false
) {
  const count = isBig ? 32 : 18
  const baseColor = isBig ? '#f97316' : '#eab308'

  // Шоквейв кольцо
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    size: isBig ? 32 : 18,
    color: '#fed7aa',
    alpha: 0.9,
    maxLife: isBig ? 18 : 12,
    life: isBig ? 18 : 12,
    kind: 'shockwave',
  })

  // Огненные искры
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = (Math.random() * 2.8 + 1.2) * (isBig ? 1.5 : 1)
    const size = Math.random() * (isBig ? 6 : 4) + 2
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      color: Math.random() > 0.4 ? baseColor : '#ef4444',
      alpha: 1,
      maxLife: Math.floor(Math.random() * 15) + 12,
      life: Math.floor(Math.random() * 15) + 12,
      kind: 'fire',
    })
  }

  // Клубы серого дыма
  const smokeCount = isBig ? 12 : 6
  for (let i = 0; i < smokeCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 1.2 + 0.3
    particles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.4,
      size: Math.random() * 8 + 6,
      color: '#64748b',
      alpha: 0.7,
      maxLife: Math.floor(Math.random() * 20) + 18,
      life: Math.floor(Math.random() * 20) + 18,
      kind: 'smoke',
    })
  }
}

// Генерация крошки от кирпича
function createBrickParticles(particles: Particle[], x: number, y: number) {
  for (let i = 0; i < 7; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 2.0 + 0.5
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 2,
      color: Math.random() > 0.5 ? '#b45309' : '#d97706',
      alpha: 1,
      maxLife: 14,
      life: 14,
      kind: 'brick',
    })
  }
}

// Выстрел танка
export function shootTank(tank: Tank, state: TanksState, sounds?: SoundCallbacks): boolean {
  if (tank.shootCooldown > 0) return false

  // Ограничение одновременных пуль на экране
  const maxBullets = tank.isPlayer ? (tank.tier >= 3 ? 2 : 1) : 1
  const currentTankBullets = state.bullets.filter((b) => b.tankId === tank.id).length
  if (currentTankBullets >= maxBullets) return false

  const { dx, dy } = getDirectionVector(tank.dir)
  const config = DIFFICULTY_CONFIG[state.difficulty]
  const speed = tank.isPlayer
    ? config.playerBulletSpeed * (tank.tier >= 2 ? 1.25 : 1)
    : config.bulletSpeed

  // Точка вылета из дула орудия
  let bx = tank.x + TANK_SIZE / 2 - BULLET_SIZE / 2
  let by = tank.y + TANK_SIZE / 2 - BULLET_SIZE / 2

  if (tank.dir === 'up') by = tank.y - BULLET_SIZE
  else if (tank.dir === 'down') by = tank.y + TANK_SIZE
  else if (tank.dir === 'left') bx = tank.x - BULLET_SIZE
  else if (tank.dir === 'right') bx = tank.x + TANK_SIZE

  state.bullets.push({
    id: `b_${Date.now()}_${Math.random()}`,
    x: bx,
    y: by,
    vx: dx * speed,
    vy: dy * speed,
    dir: tank.dir,
    owner: tank.isPlayer ? 'player' : 'enemy',
    speed,
    canBreakSteel: tank.isPlayer && tank.tier >= 4,
    tankId: tank.id,
  })

  // Кулдаун между выстрелами
  tank.shootCooldown = tank.isPlayer ? (tank.tier >= 3 ? 12 : 20) : 30

  if (tank.isPlayer) {
    sounds?.onShoot?.()
  }

  // Дульная вспышка (короткая яркая искра)
  state.particles.push({
    x: bx + BULLET_SIZE / 2,
    y: by + BULLET_SIZE / 2,
    vx: dx * 0.5,
    vy: dy * 0.5,
    size: 9,
    color: '#fef08a',
    alpha: 1,
    maxLife: 4,
    life: 4,
    kind: 'spark',
  })

  return true
}

// Спавн случайного бонуса
function spawnPowerup(state: TanksState, x: number, y: number, sounds?: SoundCallbacks) {
  const types: PowerupType[] = ['star', 'shield', 'bomb', 'timer', 'shovel', 'life']
  const randomType = types[Math.floor(Math.random() * types.length)]

  state.powerups.push({
    id: `p_${Date.now()}_${Math.random()}`,
    x: Math.max(16, Math.min(MAP_SIZE - 40, x)),
    y: Math.max(16, Math.min(MAP_SIZE - 40, y)),
    type: randomType,
    life: 1200, // 20 секунд
  })

  sounds?.onPowerup?.()
}

// Применение подобранного бонуса игроком
function applyPowerup(
  powerup: Powerup,
  state: TanksState,
  sounds?: SoundCallbacks
) {
  const p = state.player
  sounds?.onPowerup?.()

  let text = ''
  switch (powerup.type) {
    case 'star':
      p.tier = Math.min(4, p.tier + 1)
      p.speed = 1.8 + (p.tier > 1 ? 0.3 : 0)
      if (p.tier === 4) p.hp = 2
      text = '⭐ УЛУЧШЕНИЕ!'
      state.score += 500
      break

    case 'shield':
      p.shieldTimer = 600 // 10 секунд
      text = '🛡️ ЩИТ (10с)!'
      state.score += 500
      break

    case 'bomb':
      // Взрываем всех активных врагов на экране
      text = '💣 БОМБА!'
      state.screenShake = 14
      for (const enemy of state.enemies) {
        createExplosionParticles(state.particles, enemy.x + 14, enemy.y + 14, true)
        state.score += 200
        state.enemyTanksDestroyed[enemy.type === 'player' ? 'scout' : enemy.type]++
      }
      state.enemies = []
      sounds?.onExplosion?.(true)
      break

    case 'timer':
      state.freezeTimer = 480 // 8 секунд
      text = '⏱️ ЗАМОРОЗКА!'
      state.score += 500
      break

    case 'shovel':
      state.shovelTimer = 900 // 15 секунд стального бункера
      updateBaseWalls(state.grid, true)
      text = '🧱 БРОНЯ ШТАБА!'
      state.score += 500
      break

    case 'life':
      state.lives += 1
      text = '❤️ +1 ЖИЗНЬ!'
      state.score += 500
      break
  }

  state.floatingTexts.push({
    id: `ft_${Date.now()}`,
    text,
    x: powerup.x,
    y: powerup.y - 10,
    color: '#facc15',
    alpha: 1,
    life: 60,
  })
}

// Главный тик физики и состояния (вызывается на каждый кадр 60 FPS)
export function updateTanksEngine(
  state: TanksState,
  input: {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
    shoot: boolean
  },
  sounds?: SoundCallbacks
) {
  if (state.isPaused || state.isGameOver || state.isVictory) return

  const config = DIFFICULTY_CONFIG[state.difficulty]

  // Снижение тряски экрана
  if (state.screenShake > 0) {
    state.screenShake = Math.max(0, state.screenShake * 0.88 - 0.1)
  }

  // Обновление таймера лопаты (защиты штаба)
  if (state.shovelTimer > 0) {
    state.shovelTimer--
    if (state.shovelTimer === 0) {
      updateBaseWalls(state.grid, false)
    }
  }

  // Обновление таймера заморозки врагов
  if (state.freezeTimer > 0) {
    state.freezeTimer--
  }

  // 1. Движение игрока
  const p = state.player
  if (p.shieldTimer > 0) p.shieldTimer--
  if (p.shootCooldown > 0) p.shootCooldown--

  let moveX = 0
  let moveY = 0

  if (input.up) {
    p.dir = 'up'
    moveY -= p.speed
  } else if (input.down) {
    p.dir = 'down'
    moveY += p.speed
  } else if (input.left) {
    p.dir = 'left'
    moveX -= p.speed
  } else if (input.right) {
    p.dir = 'right'
    moveX += p.speed
  }

  // Проверка скольжения по льду
  const centerTileX = Math.floor((p.x + TANK_SIZE / 2) / TILE_SIZE)
  const centerTileY = Math.floor((p.y + TANK_SIZE / 2) / TILE_SIZE)
  const onIce =
    centerTileX >= 0 &&
    centerTileX < GRID_SIZE &&
    centerTileY >= 0 &&
    centerTileY < GRID_SIZE &&
    state.grid[centerTileY][centerTileX] === TileType.ICE

  if (onIce) {
    if (moveX !== 0) p.slideX = moveX * 0.85
    if (moveY !== 0) p.slideY = moveY * 0.85
  } else {
    p.slideX *= 0.75
    p.slideY *= 0.75
  }

  const finalDx = moveX + p.slideX
  const finalDy = moveY + p.slideY

  if (Math.abs(finalDx) > 0.05 || Math.abs(finalDy) > 0.05) {
    const moved = moveTankWithCollision(p, finalDx, finalDy, state.grid, state.enemies)
    p.x = moved.x
    p.y = moved.y

    // Оставляем следы гусениц
    p.trackTimer++
    if (p.trackTimer % 8 === 0) {
      state.trackMarks.push({
        x: p.x + 3,
        y: p.y + 3,
        dir: p.dir,
        alpha: 0.5,
      })
      if (state.trackMarks.length > 50) {
        state.trackMarks.shift()
      }
    }
  }

  // Стрельба игрока
  if (input.shoot) {
    shootTank(p, state, sounds)
  }

  // 2. Спавн вражеских танков
  if (state.enemiesRemaining > 0 && state.enemies.length < config.maxActiveEnemies) {
    state.enemySpawnTimer--
    if (state.enemySpawnTimer <= 0) {
      state.enemySpawnTimer = config.spawnInterval

      const types: TankType[] = ['scout', 'light', 'assault', 'heavy']
      const spawnIdx = state.enemiesRemaining % ENEMY_SPAWN_TILES.length
      const enemyType = types[Math.floor(Math.random() * types.length)]
      // Шанс бонуса на танке
      const isBonus = Math.random() < config.powerupChance

      const newEnemy = createEnemyTank(
        `e_${Date.now()}_${Math.random()}`,
        spawnIdx,
        enemyType,
        isBonus,
        state.difficulty
      )

      // Проверка свободности точки спавна
      const spawnOccupied = state.enemies.some((e) =>
        checkOverlap(
          { x: newEnemy.x, y: newEnemy.y, w: TANK_SIZE, h: TANK_SIZE },
          { x: e.x, y: e.y, w: TANK_SIZE, h: TANK_SIZE }
        )
      )

      if (!spawnOccupied) {
        state.enemies.push(newEnemy)
        state.enemiesRemaining--

        // Искра при спавне
        createExplosionParticles(state.particles, newEnemy.x + 14, newEnemy.y + 14, false)
      }
    }
  }

  // 3. AI вражеских танков
  const enemiesFrozen = state.freezeTimer > 0
  for (const enemy of state.enemies) {
    if (enemy.shootCooldown > 0) enemy.shootCooldown--

    if (enemiesFrozen) continue

    // Логика выбора направления движения врага
    // 60% тяготение к штабу или игроку
    if (Math.random() < 0.02 || enemy.trackTimer % 90 === 0) {
      const targetBase = Math.random() < 0.65
      const targetX = targetBase ? 12 * TILE_SIZE : p.x
      const targetY = targetBase ? 24 * TILE_SIZE : p.y

      const diffX = targetX - enemy.x
      const diffY = targetY - enemy.y

      const possibleDirs: Direction[] = []
      if (Math.abs(diffX) > 10) possibleDirs.push(diffX > 0 ? 'right' : 'left')
      if (diffY > 10) possibleDirs.push('down')
      if (diffY < -10) possibleDirs.push('up')
      if (possibleDirs.length === 0 || Math.random() < 0.25) {
        possibleDirs.push('up', 'down', 'left', 'right')
      }

      enemy.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)]
    }

    // Движение врага
    const { dx, dy } = getDirectionVector(enemy.dir)
    const enemyDx = dx * enemy.speed
    const enemyDy = dy * enemy.speed

    const allOtherTanks = [p, ...state.enemies.filter((e) => e.id !== enemy.id)]
    const moved = moveTankWithCollision(enemy, enemyDx, enemyDy, state.grid, allOtherTanks)

    // Если враг уперся в стену — шанс сменить направление или выстрелить
    if (moved.x === enemy.x && moved.y === enemy.y) {
      const dirs: Direction[] = ['up', 'down', 'left', 'right']
      enemy.dir = dirs[Math.floor(Math.random() * dirs.length)]

      // Стреляем в препятствие
      if (Math.random() < 0.4) {
        shootTank(enemy, state)
      }
    } else {
      enemy.x = moved.x
      enemy.y = moved.y
    }

    // Периодическая случайная стрельба врага
    if (enemy.shootCooldown <= 0 && Math.random() < 0.03) {
      shootTank(enemy, state)
    }

    enemy.trackTimer++
  }

  // 4. Обновление пуль и обработка попаданий
  const remainingBullets: Bullet[] = []

  for (let i = 0; i < state.bullets.length; i++) {
    const b = state.bullets[i]
    b.x += b.vx
    b.y += b.vy

    // Вылет за пределы экрана
    if (b.x < 0 || b.x > MAP_SIZE || b.y < 0 || b.y > MAP_SIZE) {
      sounds?.onHit?.()
      continue
    }

    // Столкновение пули с другой пулей (встречные снаряды)
    let bulletCancelled = false
    for (let j = 0; j < remainingBullets.length; j++) {
      const otherB = remainingBullets[j]
      if (
        b.owner !== otherB.owner &&
        checkOverlap(
          { x: b.x, y: b.y, w: BULLET_SIZE, h: BULLET_SIZE },
          { x: otherB.x, y: otherB.y, w: BULLET_SIZE, h: BULLET_SIZE }
        )
      ) {
        remainingBullets.splice(j, 1)
        bulletCancelled = true
        sounds?.onHit?.()
        break
      }
    }
    if (bulletCancelled) continue

    // Столкновение пули с тайлами карты
    const bBox = { x: b.x, y: b.y, w: BULLET_SIZE, h: BULLET_SIZE }
    const startC = Math.floor(bBox.x / TILE_SIZE)
    const endC = Math.floor((bBox.x + bBox.w) / TILE_SIZE)
    const startR = Math.floor(bBox.y / TILE_SIZE)
    const endR = Math.floor((bBox.y + bBox.h) / TILE_SIZE)

    let hitTile = false
    for (let r = startR; r <= endR; r++) {
      for (let c = startC; c <= endC; c++) {
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue

        const tile = state.grid[r][c]

        // Кирпичная стена
        if (tile === TileType.BRICK) {
          state.grid[r][c] = TileType.EMPTY
          hitTile = true
          createBrickParticles(state.particles, c * TILE_SIZE + 8, r * TILE_SIZE + 8)
          sounds?.onBrickHit?.()
          break
        }

        // Стальная стена
        if (tile === TileType.STEEL) {
          hitTile = true
          if (b.canBreakSteel) {
            state.grid[r][c] = TileType.EMPTY
            createExplosionParticles(state.particles, c * TILE_SIZE + 8, r * TILE_SIZE + 8, false)
          } else {
            sounds?.onHit?.()
          }
          break
        }

        // Штаб (Орел)
        if (tile === TileType.BASE) {
          hitTile = true
          state.baseDestroyed = true
          for (const bt of BASE_TILES) {
            state.grid[bt.y][bt.x] = TileType.BASE_DESTROYED
          }
          createExplosionParticles(state.particles, 12 * TILE_SIZE + 16, 24 * TILE_SIZE + 16, true)
          state.screenShake = 22
          sounds?.onBaseDestroy?.()
          state.isGameOver = true
          break
        }
      }
      if (hitTile) break
    }

    if (hitTile) continue

    // Столкновение пули с танками
    let hitTank = false

    if (b.owner === 'player') {
      // Пуля игрока бьет врагов
      for (let eIdx = 0; eIdx < state.enemies.length; eIdx++) {
        const enemy = state.enemies[eIdx]
        if (
          checkOverlap(bBox, {
            x: enemy.x,
            y: enemy.y,
            w: TANK_SIZE,
            h: TANK_SIZE,
          })
        ) {
          hitTank = true
          enemy.hp--

          if (enemy.hp <= 0) {
            // Враг уничтожен!
            createExplosionParticles(state.particles, enemy.x + 14, enemy.y + 14, true)
            sounds?.onExplosion?.(true)
            state.screenShake = 8

            // Начисление очков
            let pts = 100
            if (enemy.type === 'light') pts = 200
            else if (enemy.type === 'assault') pts = 300
            else if (enemy.type === 'heavy') pts = 400

            state.score += pts
            state.enemyTanksDestroyed[enemy.type === 'player' ? 'scout' : enemy.type]++

            state.floatingTexts.push({
              id: `pts_${Date.now()}_${Math.random()}`,
              text: `+${pts}`,
              x: enemy.x,
              y: enemy.y,
              color: '#38bdf8',
              alpha: 1,
              life: 45,
            })

            // Если мигающий бонусный танк
            if (enemy.isFlashingBonus) {
              spawnPowerup(state, enemy.x, enemy.y, sounds)
            }

            state.enemies.splice(eIdx, 1)
          } else {
            // Танк ранен (для тяжелого)
            sounds?.onHit?.()
            createExplosionParticles(state.particles, b.x, b.y, false)
          }
          break
        }
      }
    } else {
      // Пуля врага бьет игрока
      if (
        checkOverlap(bBox, {
          x: p.x,
          y: p.y,
          w: TANK_SIZE,
          h: TANK_SIZE,
        })
      ) {
        hitTank = true

        if (p.shieldTimer > 0) {
          // Щит защитил!
          sounds?.onHit?.()
          createExplosionParticles(state.particles, b.x, b.y, false)
        } else {
          // Игрок подбит
          p.hp--
          sounds?.onExplosion?.(true)
          createExplosionParticles(state.particles, p.x + 14, p.y + 14, true)
          state.screenShake = 16

          if (p.tier === 4 && p.hp > 0) {
            // Броня спасла, понижаем тир
            p.tier = 3
            p.shieldTimer = 120
          } else {
            state.lives--
            if (state.lives <= 0) {
              state.isGameOver = true
            } else {
              // Респавн игрока на базе
              state.player = createPlayerTank(1)
            }
          }
        }
      }
    }

    if (!hitTank) {
      remainingBullets.push(b)
    }
  }

  state.bullets = remainingBullets

  // 5. Подбор бонусов игроком
  state.powerups = state.powerups.filter((pow) => {
    pow.life--
    if (pow.life <= 0) return false

    if (
      checkOverlap(
        { x: p.x, y: p.y, w: TANK_SIZE, h: TANK_SIZE },
        { x: pow.x, y: pow.y, w: 26, h: 26 }
      )
    ) {
      applyPowerup(pow, state, sounds)
      return false
    }
    return true
  })

  // 6. Обновление частиц
  state.particles = state.particles.filter((pt) => {
    pt.x += pt.vx
    pt.y += pt.vy
    pt.life--
    pt.alpha = pt.life / pt.maxLife
    return pt.life > 0
  })

  // 7. Обновление следов гусениц
  state.trackMarks = state.trackMarks.filter((tm) => {
    tm.alpha -= 0.0015
    return tm.alpha > 0.05
  })

  // 8. Обновление всплывающего текста
  state.floatingTexts = state.floatingTexts.filter((ft) => {
    ft.y -= 0.5
    ft.life--
    ft.alpha = ft.life / 60
    return ft.life > 0
  })

  // 9. Проверка победы (все враги в резерве и на карте уничтожены)
  if (
    state.enemiesRemaining <= 0 &&
    state.enemies.length === 0 &&
    !state.isGameOver &&
    !state.baseDestroyed
  ) {
    state.stageCleared = true
    state.isVictory = true
  }

  // Обновление рекорда
  if (state.score > state.highScore) {
    state.highScore = state.score
  }
}
