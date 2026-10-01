import Header from '../Header'
import Footer from '../Footer'
import './Layout.css'

export default function Layout({ children, noFooter = false }) {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-layout__main">{children}</main>
      {!noFooter && <Footer />}
    </div>
  )
}
