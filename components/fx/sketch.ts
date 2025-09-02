import { first, takeLast } from 'remeda'
import p5 from 'p5'

type Point = { x: number; y: number }
type Nodo = Point & {
  born: number
  age: number
  status: string
  p: number
  luck: number
}

export default function sketch(s: p5) {
  const linep = ({ x: x0, y: y0 }: Point, { x: x1, y: y1 }: Point, p: number) => {
    const dx = x1 - x0
    const dy = y1 - y0
    s.line(x0, y0, x0 + dx * p, y0 + dy * p)
  }

  const circp = ({ x, y }: Point, r: number) => s.circle(x, y, r)

  // const clamp = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v

  class Tracer {
    private t0: number
    private edad_agonia: number
    private edad_muerte: number
    private edad_neonato: number
    private puntos: Nodo[]
    private feedLock: boolean
    private luck_tresh: number

    constructor(private dt: number, private tail: number, private col: string) {
      this.dt = dt
      this.t0 = 0
      this.tail = tail
      this.col = col // Color

      this.edad_agonia = (tail - 1) * dt
      this.edad_muerte = tail * dt
      this.edad_neonato = dt * 3

      this.puntos = []

      this.feedLock = false

      this.luck_tresh = 0.85

      s.strokeWeight(0.5)
    }

    tick() {
      const dt = s.millis() - this.t0

      if (dt > this.dt) {
        this.t0 = s.millis()
        this.ticked()
      }
    }

    ticked() {
      this.feedLock = false
    }

    edad_puntos() {
      for (const punto of this.puntos) {
        punto.age = s.millis() - punto.born
        punto.status = 'idle'

        if (punto.age < this.edad_neonato) {
          punto.status = 'naciendo'
          punto.p = punto.age / this.edad_neonato // Porcentaje de "naciencia"
        }

        if (punto.age > this.edad_agonia) {
          punto.status = 'muriendo'
          punto.p = (punto.age - this.edad_agonia) / (this.edad_muerte - this.edad_agonia) // Porcentaje de "muriencia"
        }
      }

      // Quitamos los muertos
      this.puntos = this.puntos.filter((p) => p.age < this.edad_muerte)
    }

    tracerline(p0: Nodo, p1: Nodo) {
      if (p0.status == 'muriendo') {
        linep(p1, p0, 1 - p0.p)
      } else if (p1.status == 'naciendo') {
        linep(p0, p1, p1.p)
      } else {
        linep(p0, p1, 1)
      }
    }

    tracercirc(p: Nodo) {
      if (p.status == 'muriendo') {
        if (p.luck > this.luck_tresh) {
          s.noFill()
          circp(p, 50 * (1 - p.p))
        }
        s.fill(this.col)
        circp(p, 5 * (1 - p.p))
      } else if (p.status == 'naciendo') {
        if (p.luck > this.luck_tresh) {
          s.noFill()
          circp(p, 50 * p.p)
        }
        s.fill(this.col)
        circp(p, 5 * p.p)
      } else {
        s.fill(this.col)
        circp(p, 5)
      }
    }

    draw() {
      // Cero puntos
      this.tick()
      this.edad_puntos()

      if (this.puntos.length < 1) return

      // Head - Un punto
      let p0 = first(this.puntos)!
      this.tracercirc(p0)

      if (this.puntos.length < 2) return

      // Medios - Hay 2 o más puntos
      const cola = takeLast(this.puntos, this.puntos.length - 1)

      for (const p of cola) {
        this.tracerline(p0, p)
        this.tracercirc(p)
        p0 = p
      }
    }

    feed(punto: Point) {
      if (!this.feedLock) {
        this.puntos.push({ ...punto, born: s.millis(), luck: s.random(), age: 0, status: 'neonato', p: 0 })
        this.feedLock = true
      }
    }
  }

  const dt = 200
  const puntos = 10
  let tracer: Tracer

  function setup() {
    s.createCanvas(s.windowWidth, s.windowHeight)
    s.stroke(220, 200, 185)
    s.fill(220, 200, 185)
    tracer = new Tracer(dt, puntos, '#ECA958')
  }

  function draw() {
    // s.background(255);
    // s.circle(s.mouseX, s.mouseY, 5)
    // s.circle(400, 400, 50)
    // linep({x: 0, y: 0}, {x: 200, y: 200}, millis()/5000)
    if (tracer) tracer.draw()
  }

  function mouseMoved() {
    if (tracer) tracer.feed({ x: s.mouseX, y: s.mouseY })
  }

  function windowResized() {
    // const {width, height} = document.body.getBoundingClientRect()
    s.resizeCanvas(s.windowWidth, s.windowHeight)
  }

  s.draw = draw
  s.setup = setup
  s.mouseMoved = mouseMoved
  s.windowResized = windowResized
}
