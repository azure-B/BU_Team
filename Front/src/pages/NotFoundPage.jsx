import Layout from '../components/layout/Layout'
import { motion } from 'framer-motion'

export default function NotFoundPage() {
  return (
    <Layout noFooter>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', textAlign:'center', gap:'var(--space-6)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{ fontSize: '6rem', lineHeight: 1 }}
        >
          🚀
        </motion.div>
        <motion.h1
          style={{ fontSize:'var(--font-size-3xl)', fontWeight:800 }}
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay: 0.1 }}
        >
          404
        </motion.h1>
        <motion.p
          style={{ color:'var(--color-text-muted)' }}
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay: 0.2 }}
        >
          찾을 수 없는 페이지입니다.
        </motion.p>
      </div>
    </Layout>
  )
}
