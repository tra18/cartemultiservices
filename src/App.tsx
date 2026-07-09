import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import {
  MerchantProtectedRoute,
  MerchantPublicRoute,
} from './components/merchant/MerchantProtectedRoute'
import { MerchantLayout } from './components/merchant/MerchantLayout'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AuthProvider } from './context/AuthContext'
import {
  AdminProtectedRoute,
  AdminPublicRoute,
} from './components/admin/AdminProtectedRoute'
import { AdminLayout } from './components/admin/AdminLayout'
import { MerchantAuthProvider } from './context/MerchantAuthContext'
import { CardProvider } from './context/CardContext'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Login } from './pages/Login'
import { Pay } from './pages/Pay'
import { QrPay } from './pages/QrPay'
import { Recharge } from './pages/Recharge'
import { Register } from './pages/Register'
import { ScanPay } from './pages/ScanPay'
import { MerchantCollect } from './pages/merchant/MerchantCollect'
import { MerchantDashboard } from './pages/merchant/MerchantDashboard'
import { MerchantHistory } from './pages/merchant/MerchantHistory'
import { MerchantLogin } from './pages/merchant/MerchantLogin'
import { MerchantRegister } from './pages/merchant/MerchantRegister'
import { MerchantWithdrawals } from './pages/merchant/MerchantWithdrawals'
import { MerchantCategories } from './pages/merchant/MerchantCategories'
import { ActivateCard } from './pages/ActivateCard'
import { BuyFuel } from './pages/BuyFuel'
import { MyCardOrder } from './pages/MyCardOrder'
import { CardSecurity } from './pages/CardSecurity'
import { Profile } from './pages/Profile'
import { OrderReplacementCard } from './pages/OrderReplacementCard'
import { ForgotPassword } from './pages/ForgotPassword'
import { OrderCard } from './pages/OrderCard'
import { Home } from './pages/Home'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminOrderDetail } from './pages/admin/AdminOrderDetail'
import { AdminPrintCard } from './pages/admin/AdminPrintCard'
import { AdminFinance } from './pages/admin/AdminFinance'
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH } from './constants/brand'

export default function App() {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <MerchantAuthProvider>
          <BrowserRouter>
            <Routes>
            {/* Portail admin */}
            <Route
              path={ADMIN_LOGIN_PATH}
              element={
                <AdminPublicRoute>
                  <AdminLogin />
                </AdminPublicRoute>
              }
            />
            <Route
              path={ADMIN_BASE_PATH}
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<AdminOrders />} />
              <Route path="finances" element={<AdminFinance />} />
              <Route path="commandes/:orderId" element={<AdminOrderDetail />} />
              <Route path="commandes/:orderId/imprimer" element={<AdminPrintCard />} />
            </Route>

            {/* Portail commerçant */}
            <Route
              path="/commercant/connexion"
              element={
                <MerchantPublicRoute>
                  <MerchantLogin />
                </MerchantPublicRoute>
              }
            />
            <Route
              path="/commercant/inscription"
              element={
                <MerchantPublicRoute>
                  <MerchantRegister />
                </MerchantPublicRoute>
              }
            />
            <Route
              path="/commercant"
              element={
                <MerchantProtectedRoute>
                  <MerchantLayout />
                </MerchantProtectedRoute>
              }
            >
              <Route index element={<MerchantDashboard />} />
              <Route path="encaisser" element={<MerchantCollect />} />
              <Route path="retraits" element={<MerchantWithdrawals />} />
              <Route path="categories" element={<MerchantCategories />} />
              <Route path="historique" element={<MerchantHistory />} />
            </Route>

            {/* Page d'accueil publique */}
            <Route path="/" element={<Home />} />

            {/* Espace client — routes publiques */}
            <Route
              path="/commander-carte"
              element={<OrderCard />}
            />
            <Route
              path="/connexion"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/inscription"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/mot-de-passe-oublie"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/paiement-qr/:paymentId"
              element={
                <ProtectedRoute>
                  <QrPay />
                </ProtectedRoute>
              }
            />

            {/* Espace client — routes protégées (layout sans path pour ne pas intercepter /commercant) */}
            <Route
              element={
                <ProtectedRoute>
                  <CardProvider>
                    <Layout />
                  </CardProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/tableau-de-bord" element={<Dashboard />} />
              <Route path="/recharger" element={<Recharge />} />
              <Route path="/payer" element={<Pay />} />
              <Route path="/carburant" element={<BuyFuel />} />
              <Route path="/scanner" element={<ScanPay />} />
              <Route path="/ma-commande" element={<MyCardOrder />} />
              <Route path="/activer-carte" element={<ActivateCard />} />
              <Route path="/securite-carte" element={<CardSecurity />} />
              <Route path="/commander-remplacement" element={<OrderReplacementCard />} />
              <Route path="/profil" element={<Profile />} />
              <Route path="/historique" element={<History />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MerchantAuthProvider>
    </AuthProvider>
    </AdminAuthProvider>
  )
}
