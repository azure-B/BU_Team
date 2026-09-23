import { motion } from 'framer-motion'
import Layout from '../components/layout/Layout'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import './HomePage.css'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden:   { opacity: 0, y: 30 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const FEATURES = [
  { icon: '⚡', title: '빠른 속도', desc: 'Vite 기반으로 번개 같은 HMR과 빌드를 경험하세요.' },
  { icon: '🎨', title: '모션 UI', desc: 'Framer Motion으로 부드러운 애니메이션을 손쉽게.' },
  { icon: '🧩', title: '컴포넌트 설계', desc: '재사용성을 고려한 명확한 폴더 구조로 유지보수가 쉽습니다.' },
]

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__bg-glow" aria-hidden="true" />
        <div className="container">
          <motion.div
            className="hero__content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="hero__badge" variants={itemVariants}>
              ✨ React + Vite + Framer Motion
            </motion.div>

            <motion.h1 className="hero__title" variants={itemVariants}>
              아름다운 웹을<br />
              <span className="gradient-text">함께 만들어요</span>
            </motion.h1>

            <motion.p className="hero__desc" variants={itemVariants}>
              빠른 개발, 부드러운 애니메이션, 깔끔한 구조.<br />
              당신의 아이디어를 현실로 만드는 가장 좋은 시작점.
            </motion.p>

            <motion.div className="hero__actions" variants={itemVariants}>
              <Button size="lg">시작하기</Button>
              <Button size="lg" variant="secondary">더 알아보기</Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <motion.div
            className="features__grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {FEATURES.map(({ icon, title, desc }) => (
              <motion.div key={title} variants={itemVariants}>
                <Card>
                  <div className="feature-card__icon">{icon}</div>
                  <h2 className="feature-card__title">{title}</h2>
                  <p className="feature-card__desc">{desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}
