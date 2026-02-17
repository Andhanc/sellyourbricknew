import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'
import './i18n/config'
import { getClerkPublishableKey, getGoogleClientId } from './utils/env'

// Поддержка как REACT_APP_ (Create React App), так и VITE_ (Vite)
const GOOGLE_CLIENT_ID = getGoogleClientId()
const PUBLISHABLE_KEY = getClerkPublishableKey()

if (!PUBLISHABLE_KEY) {
<<<<<<< HEAD
  throw new Error('Missing Clerk Publishable Key. Please set REACT_APP_CLERK_PUBLISHABLE_KEY or VITE_CLERK_PUBLISHABLE_KEY in .env.local')
=======
  const errorMessage = `
    ⚠️ Missing Clerk Publishable Key!
    
    Please set one of the following environment variables:
    - REACT_APP_CLERK_PUBLISHABLE_KEY
    - VITE_CLERK_PUBLISHABLE_KEY
    
    For Railway deployment:
    1. Go to Railway Dashboard → Your Project → Variables
    2. Add: REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...
    3. Railway will automatically restart your app
    
    For local development:
    Create .env.local file with: REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...
  `
  console.error(errorMessage)
  // Показываем ошибку в консоли, но не падаем с белым экраном
  // Вместо этого покажем сообщение пользователю
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; padding: 20px;">
      <div style="max-width: 600px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 24px;">
        <h2 style="color: #856404; margin-top: 0;">⚠️ Configuration Error</h2>
        <p style="color: #856404; line-height: 1.6;">
          <strong>Missing Clerk Publishable Key</strong>
        </p>
        <p style="color: #856404; line-height: 1.6;">
          Please set <code>REACT_APP_CLERK_PUBLISHABLE_KEY</code> or <code>VITE_CLERK_PUBLISHABLE_KEY</code> environment variable.
        </p>
        <p style="color: #856404; line-height: 1.6;">
          <strong>For Railway:</strong> Go to Dashboard → Variables → Add the key
        </p>
        <p style="color: #856404; line-height: 1.6; margin-bottom: 0;">
          Check the browser console for more details.
        </p>
      </div>
    </div>
  `
  throw new Error('Missing Clerk Publishable Key')
>>>>>>> 9834624ce85afa7fe9aa397716cd67d8da737a39
}

// Оборачиваем App в GoogleOAuthProvider только если client_id установлен
const AppWrapper = () => {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    )
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      afterSignInUrl="/profile"
      afterSignUpUrl="/profile"
    >
      <AppWrapper />
    </ClerkProvider>
  </React.StrictMode>,
)





