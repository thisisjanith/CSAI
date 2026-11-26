import { Outlet } from 'react-router'
import Navbar from './Navbar'
import Footer from './Footer'
import { useLenis, useScrollOnNavigate } from '../hooks/useLenis'

export default function PublicLayout() {
  useLenis()
  useScrollOnNavigate()
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
