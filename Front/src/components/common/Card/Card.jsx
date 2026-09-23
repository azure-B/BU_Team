import { motion } from 'framer-motion'
import './Card.css'

/**
 * 공용 Card 컴포넌트
 * hover시 살짝 위로 떠오르는 효과 포함
 */
export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <motion.div
      className={`card ${className}`}
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  )
}
