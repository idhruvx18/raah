import { useIntersection } from '../components/ui/useIntersection'
import { ExternalLink } from 'lucide-react'

function Reveal({ children, delay = 0 }) {
  const [ref, v] = useIntersection()
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  )
}

const REFERENCES = [
  {
    category: 'Datasets',
    items: [
      {
        title: 'India Driving Dataset (IDD)',
        description: 'A dataset for exploring problems of automated driving in unstructured environments — India-specific with diverse road conditions.',
        url: 'https://idd.insaan.iiit.ac.in/',
        tags: ['Segmentation', 'Detection', 'Indian Roads'],
      },
      {
        title: 'IDD-3D',
        description: '3D extension of the India Driving Dataset, including LiDAR point clouds and 3D bounding boxes for autonomous driving.',
        url: 'https://idd.insaan.iiit.ac.in/',
        tags: ['LiDAR', '3D Detection', 'Point Cloud'],
      },
    ],
  },
  {
    category: 'Simulation',
    items: [
      {
        title: 'CARLA Open-Source Simulator',
        description: 'An open-source simulator for autonomous driving research providing photorealistic environments and a flexible Python API.',
        url: 'https://carla.org/',
        tags: ['Simulation', 'Unreal Engine', 'Python API'],
      },
      {
        title: 'MathWorks Automated Driving Toolbox',
        description: 'MATLAB-based toolbox for designing and testing autonomous driving systems, including path planning and sensor fusion.',
        url: 'https://www.mathworks.com/products/automated-driving.html',
        tags: ['MATLAB', 'Path Planning', 'Sensor Fusion'],
      },
    ],
  },
  {
    category: 'Path Planning',
    items: [
      {
        title: 'Hybrid A* Algorithm',
        description: 'Motion planning for autonomous vehicles using non-holonomic constraints. Original paper by Dolgov et al. (IJRR 2010).',
        url: 'https://ai.stanford.edu/~ddolgov/papers/dolgov_gpp_stair08.pdf',
        tags: ['Planning', 'Non-holonomic', 'Autonomous Vehicles'],
      },
      {
        title: 'Vehicle Costmaps and Navigation Planners (ROS)',
        description: 'Documentation and implementation reference for costmap-based navigation used in robotics and autonomous systems.',
        url: 'http://wiki.ros.org/costmap_2d',
        tags: ['ROS', 'Costmap', 'Navigation'],
      },
    ],
  },
  {
    category: 'Prediction & Risk',
    items: [
      {
        title: 'Social Force Model for Pedestrian Trajectory Prediction',
        description: 'Helbing & Molnár (1995). Foundation of social force-based pedestrian motion prediction still used in AV stacks.',
        url: 'https://arxiv.org/abs/cond-mat/9805244',
        tags: ['Prediction', 'Pedestrian', 'Social Force'],
      },
      {
        title: 'Collision Avoidance via Velocity Obstacles (VO)',
        description: 'Fiorini & Shiller (1998). Velocity obstacle framework for real-time collision avoidance in dynamic environments.',
        url: 'https://journals.sagepub.com/doi/10.1177/027836499801700706',
        tags: ['Collision Avoidance', 'Velocity Obstacles'],
      },
    ],
  },
  {
    category: 'Tracking',
    items: [
      {
        title: 'ByteTrack: Multi-Object Tracking',
        description: 'Zhang et al. (ECCV 2022). High-performance MOT algorithm that tracks every detection box, including low-confidence ones.',
        url: 'https://arxiv.org/abs/2110.06864',
        tags: ['Tracking', 'MOT', 'ECCV 2022'],
      },
    ],
  },
  {
    category: 'Detection',
    items: [
      {
        title: 'YOLOv9: Learning What You Want to Learn',
        description: 'Wang et al. (2024). State-of-the-art real-time object detection with programmable gradient information.',
        url: 'https://arxiv.org/abs/2402.13616',
        tags: ['Detection', 'Real-time', 'YOLOv9'],
      },
    ],
  },
]

function RefCard({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border border-raah-border rounded-sm p-5 hover:border-raah-accent transition-all duration-200 bg-raah-bg hover:bg-raah-surface"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-medium text-raah-heading group-hover:text-raah-accent transition-colors leading-snug">
          {item.title}
        </h3>
        <ExternalLink size={12} className="text-raah-muted shrink-0 mt-0.5 group-hover:text-raah-accent transition-colors" />
      </div>
      <p className="text-xs text-raah-muted leading-relaxed mb-3">{item.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {item.tags.map((t) => (
          <span key={t} className="text-[10px] px-2 py-0.5 bg-raah-surface border border-raah-border rounded-sm text-raah-muted">
            {t}
          </span>
        ))}
      </div>
    </a>
  )
}

export default function Research() {
  return (
    <div className="bg-raah-bg min-h-screen pt-14">
      <div className="border-b border-raah-border">
        <div className="raah-container py-12">
          <p className="raah-label mb-4">Research</p>
          <h1 className="text-hero-sm font-light text-raah-heading max-w-2xl mb-4">
            Built on rigorous foundations.
          </h1>
          <p className="text-base text-raah-muted max-w-xl leading-relaxed">
            RAAH draws from established research in autonomous driving, motion planning, and object tracking. All references are real, cited accurately.
          </p>
        </div>
      </div>

      <div className="raah-container py-16 space-y-14">
        {REFERENCES.map((section, si) => (
          <Reveal key={section.category} delay={si * 80}>
            <h2 className="text-xl font-medium text-raah-heading mb-5">{section.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.map((item) => (
                <RefCard key={item.title} item={item} />
              ))}
            </div>
          </Reveal>
        ))}

        {/* Problem statement box */}
        <Reveal delay={600}>
          <div className="p-8 border border-raah-border rounded-sm bg-raah-surface">
            <p className="raah-label mb-3">Problem Statement</p>
            <p className="text-lg font-medium text-raah-heading mb-2">SIH26037</p>
            <p className="text-sm text-raah-body leading-relaxed mb-4">
              Adaptive Path Planning and Collision Avoidance for Autonomous Vehicles on Unstructured Indian Roads
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="text-xs px-3 py-1 border border-raah-border rounded-sm text-raah-muted">Theme: Robotics and Drones</span>
              <span className="text-xs px-3 py-1 border border-raah-border rounded-sm text-raah-muted">Category: Software</span>
              <span className="text-xs px-3 py-1 border border-raah-border rounded-sm text-raah-muted">Edition: SIH 2026</span>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
