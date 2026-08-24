import Nav from './Nav'
import Footer from './Footer'

export default function Layout({ children, noPad = false, darkFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-raah-bg">
      <Nav />
      <main className={`flex-1 ${noPad ? '' : 'pt-14'}`}>
        {children}
      </main>
      <Footer dark={darkFooter} />
    </div>
  )
}
