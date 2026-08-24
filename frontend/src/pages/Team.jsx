import { useIntersection } from '../components/ui/useIntersection'

function Reveal({ children, delay = 0 }) {
  const [ref, v] = useIntersection()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  )
}

const TEAM = [
  { name: 'Dhruv Sharma',     initials: 'DS' },
  { name: 'Manan Saini',      initials: 'MS' },
  { name: 'Vanshika Sharma',  initials: 'VS' },
  { name: 'Siya Chaudhary',   initials: 'SC' },
  { name: 'Dhruv Talan',      initials: 'DT' },
  { name: 'Devansh Tyagi',    initials: 'DY' },
]

const VALUES = [
  { label: 'Safety first', desc: 'Every design decision prioritises the safety of all road users — not just the autonomous vehicle.' },
  { label: 'Explainable AI', desc: 'The system must be able to explain every decision. Black-box autonomy is not acceptable for safety-critical applications.' },
  { label: 'Designed for India', desc: 'RAAH is not a port of Western AV research. It is built from the ground up for the unique complexity of Indian roads.' },
  { label: 'Open research', desc: 'All algorithms, datasets and findings will be published openly to accelerate the broader research community.' },
]

export default function Team() {
  return (
    <div className="bg-raah-bg min-h-screen pt-14">
      <div className="border-b border-raah-border">
        <div className="raah-container py-12">
          <p className="raah-label mb-4">Team</p>
          <h1 className="text-hero-sm font-light text-raah-heading max-w-2xl mb-4">
            The people behind RAAH.
          </h1>
          <p className="text-base text-raah-muted max-w-xl leading-relaxed">
            Built for Smart India Hackathon 2026. A multidisciplinary team combining expertise in AI, robotics, control systems, and product design.
          </p>
        </div>
      </div>

      <div className="raah-container py-16 space-y-16">

        {/* Team grid */}
        <Reveal>
          <h2 className="text-xl font-medium text-raah-heading mb-6">Team Members</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-raah-border">
            {TEAM.map((member, i) => (
              <Reveal key={member.name} delay={i * 70}>
                <div className="bg-raah-bg p-6 flex flex-col items-start">
                  <div className="w-10 h-10 rounded-full bg-raah-surface border border-raah-border flex items-center justify-center mb-4">
                    <span className="text-xs font-semibold text-raah-muted">{member.initials}</span>
                  </div>
                  <p className="text-sm font-medium text-raah-heading leading-snug">{member.name}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* Values */}
        <Reveal delay={100}>
          <h2 className="text-xl font-medium text-raah-heading mb-6">What we believe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-raah-border">
            {VALUES.map(({ label, desc }) => (
              <div key={label} className="bg-raah-bg p-8">
                <div className="w-4 h-px bg-raah-accent mb-4" />
                <p className="text-base font-medium text-raah-heading mb-2">{label}</p>
                <p className="text-sm text-raah-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Problem statement */}
        <Reveal delay={200}>
          <div className="p-8 bg-raah-dark rounded-sm">
            <p className="raah-label text-white/30 mb-4">Our mission</p>
            <p className="text-2xl font-light text-white leading-relaxed max-w-2xl">
              "Don't just follow a path. Understand the environment. Predict what happens next. Assess the risk. Choose the safer path. Adapt when reality changes."
            </p>
            <p className="text-sm text-white/30 mt-6">RAAH — Risk-Aware Adaptive Autonomous Navigation</p>
          </div>
        </Reveal>

      </div>
    </div>
  )
}
