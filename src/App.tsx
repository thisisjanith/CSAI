import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { BookOpen, CalendarDays, CreditCard, GraduationCap, LayoutDashboard, Receipt, User, Users } from 'lucide-react'
import { AuthProvider } from './context/AuthContext'
import PublicLayout from './components/PublicLayout'
import { PageLoader } from './components/Spinner'
import RequireAuth from './components/dashboard/RequireAuth'
import type { NavItem } from './components/dashboard/DashboardShell'

const Home = lazy(() => import('./pages/Home'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const SignIn = lazy(() => import('./pages/auth/SignIn'))
const SignUp = lazy(() => import('./pages/auth/SignUp'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'))
const DashboardShell = lazy(() => import('./components/dashboard/DashboardShell'))
const Overview = lazy(() => import('./pages/student/Overview'))
const MyCourses = lazy(() => import('./pages/student/MyCourses'))
const Schedule = lazy(() => import('./pages/student/Schedule'))
const Payments = lazy(() => import('./pages/student/Payments'))
const Profile = lazy(() => import('./pages/student/Profile'))
const Checkout = lazy(() => import('./pages/student/Checkout'))
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'))
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'))
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'))
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'))
const AdminSessions = lazy(() => import('./pages/admin/AdminSessions'))

const s = (el: ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>

const studentNav: NavItem[] = [
  { to: '/dashboard', label: 'Overview', short: 'Home', icon: LayoutDashboard, end: true },
  { to: '/dashboard/courses', label: 'My courses', short: 'Courses', icon: BookOpen },
  { to: '/dashboard/schedule', label: 'Schedule', short: 'Classes', icon: CalendarDays },
  { to: '/dashboard/payments', label: 'Payments', icon: Receipt },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Overview', short: 'Home', icon: LayoutDashboard, end: true },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/sessions', label: 'Schedule', short: 'Classes', icon: CalendarDays },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/courses', label: 'Courses', icon: GraduationCap },
]

function NotFound() {
  return (
    <div className="container-x grid min-h-[80dvh] place-items-center pt-20 text-center">
      <div>
        <p className="font-display text-7xl font-bold text-gradient">404</p>
        <p className="mt-3 text-white/60">This page doesn't exist.</p>
        <Link to="/" className="btn btn-primary mt-6">Go home</Link>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: s(<Home />) },
      { path: 'courses', element: s(<Courses />) },
      { path: 'courses/:slug', element: s(<CourseDetail />) },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: s(<Outlet />),
    children: [
      { path: 'signin', element: <SignIn /> },
      { path: 'signup', element: <SignUp /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'auth/callback', element: <AuthCallback /> },
    ],
  },
  {
    path: 'dashboard',
    element: s(<RequireAuth><DashboardShell nav={studentNav} area="student" /></RequireAuth>),
    children: [
      { index: true, element: s(<Overview />) },
      { path: 'courses', element: s(<MyCourses />) },
      { path: 'schedule', element: s(<Schedule />) },
      { path: 'payments', element: s(<Payments />) },
      { path: 'profile', element: s(<Profile />) },
      { path: 'checkout/:slug', element: s(<Checkout />) },
    ],
  },
  {
    path: 'admin',
    element: s(<RequireAuth admin><DashboardShell nav={adminNav} area="admin" /></RequireAuth>),
    children: [
      { index: true, element: s(<AdminOverview />) },
      { path: 'payments', element: s(<AdminPayments />) },
      { path: 'sessions', element: s(<AdminSessions />) },
      { path: 'students', element: s(<AdminStudents />) },
      { path: 'courses', element: s(<AdminCourses />) },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </AuthProvider>
  )
}
