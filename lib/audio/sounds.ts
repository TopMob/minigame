// Менеджер звуковых эффектов на чистом Web Audio API
// Работает полностью автономно (оффлайн) без внешних медиа-файлов

class SoundEffectsManager {
  private ctx: AudioContext | null = null
  private muted: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('minigame:sound_muted')
        if (saved !== null) {
          this.muted = saved === 'true'
        }
      } catch {}
    }
  }

  public get isMuted(): boolean {
    return this.muted
  }

  public toggleMute(): boolean {
    this.muted = !this.muted
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('minigame:sound_muted', this.muted.toString())
      } catch {}
    }
    return this.muted
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  // Звук съедания обычного яблока
  public playEat(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } catch {}
  }

  // Звук бонуса (золотое яблоко)
  public playBonus(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.05)
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.14, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.22)
    } catch {}
  }

  // Звук проигрыша
  public playGameOver(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.22)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.22)
    } catch {}
  }

  // Звук победы / раскрытия поля
  public playVictory(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.08)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.16)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.35)
    } catch {}
  }

  // Звук хода / клика по клетке
  public playClick(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(540, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.09, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch {}
  }

  // Звук ничьей
  public playDraw(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(370, ctx.currentTime)
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.22)
    } catch {}
  }

  // Звук удара ракеткой по мячу (настольный теннис / теннис)
  public playPaddleHit(isSmash = false): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = isSmash ? 'triangle' : 'sine'
      const startFreq = isSmash ? 880 : 540
      const endFreq = isSmash ? 320 : 260
      const duration = isSmash ? 0.08 : 0.05

      osc.frequency.setValueAtTime(startFreq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration)

      const volume = isSmash ? 0.25 : 0.16
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }

  // Звук отскока мяча от стола
  public playTableBounce(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(750, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.035)

      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.035)
    } catch {}
  }

  // Звук касания сетки
  public playNetHit(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.06)

      gain.gain.setValueAtTime(0.14, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.06)
    } catch {}
  }

  // Звук раскрытия буквы в Словоцепи — тихий мелодичный "тик"
  public playReveal(isCorrect: boolean): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'

      if (isCorrect) {
        osc.frequency.setValueAtTime(660, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06)
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.06)
      }

      gain.gain.setValueAtTime(0.07, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } catch {}
  }

  // Звук взятия шашки — короткий "хлопок"
  public playCapture(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12)

      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {}
  }

  // Звук сброса фишки в Connect4 — "глухой удар"
  public playDrop(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1)

      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {}
  }

  // Звук хода фигуры в Шахматах — мягкий деревянный щелчок
  public playChessMove(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(480, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04)

      gain.gain.setValueAtTime(0.14, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.045)
    } catch {}
  }

  // Звук шаха в Шахматах — тревожный двойной сигнал
  public playChessCheck(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08) // G5

      gain1.gain.setValueAtTime(0.15, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)

      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start()
      osc1.stop(ctx.currentTime + 0.22)
    } catch {}
  }

  // --- РЕВЕРСИ ---

  // Звук установки фишки на сукно (тактильный деревянно-каменный стук)
  public playReversiPlace(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(320, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05)

      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.06)
    } catch {}
  }

  // Звук переворота фишек (легкий шелест / щелчок)
  public playReversiFlip(index: number = 0): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const startTime = ctx.currentTime + Math.min(index * 0.035, 0.3)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(450 + (index % 5) * 40, startTime)
      osc.frequency.exponentialRampToValueAtTime(260, startTime + 0.04)

      gain.gain.setValueAtTime(0.1, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.045)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + 0.045)
    } catch {}
  }

  // Звук пропуска хода (двухтональный мягкий сигнал)
  public playReversiPass(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.08)

      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch {}
  }

  // --- МОРСКОЙ БОЙ ---

  // Выстрел артиллерии / пуск торпеды
  public playBattleshipShot(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12)

      gain.gain.setValueAtTime(0.16, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }

  // Промах: всплеск воды
  public playBattleshipMiss(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      // Имитация всплеска через фильтрованный белый шум или модулированный синус
      const bufferSize = ctx.sampleRate * 0.18
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(600, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.18)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.14, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      noise.start()
      noise.stop(ctx.currentTime + 0.18)
    } catch {}
  }

  // Попадание: взрыв и треск
  public playBattleshipHit(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      // Мощный низкий импульс
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(180, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.22)

      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)

      // Шумовой компонент взрыва
      const bufferSize = ctx.sampleRate * 0.2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.7
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.18, ctx.currentTime)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      noise.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noise.start()
      noise.stop(ctx.currentTime + 0.2)
    } catch {}
  }

  // Потопление: раскатистый двойной взрыв
  public playBattleshipSink(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      // Низкочастотный рокот
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(120, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.45)

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.45)

      // Звук аварийной сирены / гидроакустического эха
      const echo = ctx.createOscillator()
      const echoGain = ctx.createGain()
      echo.type = 'sine'
      echo.frequency.setValueAtTime(320, ctx.currentTime + 0.1)
      echo.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.4)
      echoGain.gain.setValueAtTime(0, ctx.currentTime)
      echoGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.1)
      echoGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

      echo.connect(echoGain)
      echoGain.connect(ctx.destination)
      echo.start(ctx.currentTime + 0.1)
      echo.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  // Сонар: характерный «пинг» подлодки
  public playSonar(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1100, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5)

      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    } catch {}
  }

  // Установка корабля в доке / на поле (магнитный щелчок)
  public playPlacementSnap(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(540, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.05)

      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.06)
    } catch {}
  }

  // --- ТАНЧИКИ (BATTLE CITY / TANKS) ---

  // Выстрел танковой пушки (сочный бас + шумовой хлопок)
  public playTankShoot(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(280, now)
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12)

      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.12)

      // Короткий шум выхлопа
      const bufSize = Math.floor(ctx.sampleRate * 0.06)
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const nGain = ctx.createGain()
      nGain.gain.setValueAtTime(0.15, now)
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
      noise.connect(nGain)
      nGain.connect(ctx.destination)
      noise.start(now)
    } catch {}
  }

  // Попадание по броне танка / рикошет о сталь
  public playTankHit(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(820, now)
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.09)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.09)
    } catch {}
  }

  // Разрушение кирпичной стены (хруст / обвал)
  public playBrickHit(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const bufSize = Math.floor(ctx.sampleRate * 0.08)
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3))
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(750, now)
      filter.Q.setValueAtTime(1.5, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start(now)
    } catch {}
  }

  // Взрыв танка (малый или большой)
  public playTankExplosion(isBig = false): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const duration = isBig ? 0.45 : 0.28

      // Низкочастотный удар
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(isBig ? 130 : 160, now)
      osc.frequency.exponentialRampToValueAtTime(25, now + duration)

      oscGain.gain.setValueAtTime(isBig ? 0.32 : 0.22, now)
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(oscGain)
      oscGain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + duration)

      // Мощный шумовой взрыв
      const bufSize = Math.floor(ctx.sampleRate * duration)
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(isBig ? 900 : 700, now)
      filter.frequency.exponentialRampToValueAtTime(80, now + duration)

      const nGain = ctx.createGain()
      nGain.gain.setValueAtTime(isBig ? 0.35 : 0.22, now)
      nGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      noise.connect(filter)
      filter.connect(nGain)
      nGain.connect(ctx.destination)
      noise.start(now)
      noise.stop(now + duration)
    } catch {}
  }

  // Сбор бонуса (ретро-арпеджио 8-bit)
  public playTankPowerup(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, now + idx * 0.05)

        gain.gain.setValueAtTime(0.12, now + idx * 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.05)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.05)
        osc.stop(now + (idx + 1) * 0.05)
      })
    } catch {}
  }

  // Уничтожение штаба (Орла)
  public playBaseDestroy(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(100, now)
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.9)

      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.9)

      // Взрывной грохот
      const bufSize = Math.floor(ctx.sampleRate * 0.8)
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(600, now)
      filter.frequency.exponentialRampToValueAtTime(40, now + 0.8)

      const nGain = ctx.createGain()
      nGain.gain.setValueAtTime(0.35, now)
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

      noise.connect(filter)
      filter.connect(nGain)
      nGain.connect(ctx.destination)
      noise.start(now)
      noise.stop(now + 0.8)
    } catch {}
  }

  // --- САПЁР (MINESWEEPER) ---

  // Открытие клетки (мягкий тактильный щелчок или приятный каскадный перелив)
  public playMinesweeperReveal(cascadeCount: number = 1): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      if (cascadeCount <= 1) {
        // Одиночный приятный щелчок
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.04)

        gain.gain.setValueAtTime(0.14, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.04)
      } else {
        // Каскадный перелив (эффект ручейка / домино)
        const notes = [330, 392, 440, 523, 587]
        const steps = Math.min(notes.length, Math.max(2, Math.floor(cascadeCount / 2)))
        for (let i = 0; i < steps; i++) {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(notes[i], now + i * 0.035)

          gain.gain.setValueAtTime(0.09, now + i * 0.035)
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.06)

          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + i * 0.035)
          osc.stop(now + i * 0.035 + 0.06)
        }
      }
    } catch {}
  }

  // Установка или снятие флага
  public playMinesweeperFlag(isPlaced: boolean = true): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      if (isPlaced) {
        osc.frequency.setValueAtTime(600, now)
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.06)
      } else {
        osc.frequency.setValueAtTime(800, now)
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.05)
      }

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.06)
    } catch {}
  }

  // Звук хординга (двойной быстрый щелчок)
  public playMinesweeperChord(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      ;[0, 0.03].forEach((delay, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(idx === 0 ? 520 : 660, now + delay)

        gain.gain.setValueAtTime(0.12, now + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.035)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + delay)
        osc.stop(now + delay + 0.035)
      })
    } catch {}
  }

  // Звук подсказки (мягкий колокольчик)
  public playMinesweeperHint(): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const notes = [659.25, 880] // E5 -> A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.07)

        gain.gain.setValueAtTime(0.1, now + idx * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.07)
        osc.stop(now + idx * 0.07 + 0.18)
      })
    } catch {}
  }

  // Звук взрыва мины
  public playMinesweeperExplosion(): void {
    this.playTankExplosion(true)
  }
}

export const soundManager = new SoundEffectsManager()