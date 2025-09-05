# Authentication System Documentation

## Overview

This document describes the professional-grade authentication system implemented for Price Lens, built with Supabase Auth and Next.js 15. The system is designed for maximum reliability, security, and user experience.

## Architecture

### Core Components

1. **Centralized Configuration** (`src/lib/auth-config.ts`)
   - All auth settings in one place
   - Consistent configuration across client/server
   - Easy maintenance and updates

2. **Enhanced Supabase Clients**
   - Client-side: `src/lib/supabase/client.ts`
   - Server-side: `src/lib/supabase/server.ts`
   - Middleware: `src/lib/supabase/middleware.ts`

3. **State Management** (`src/contexts/UserContext.tsx`)
   - Automatic session refresh
   - Profile management
   - Error handling
   - Activity tracking

4. **Session Monitoring** (`src/components/SessionMonitor.tsx`)
   - Development debugging tool
   - Real-time session status
   - Manual refresh capability

## Key Features

### Session Persistence

- **Automatic Token Refresh**: Sessions refresh every 30 minutes
- **Persistent Storage**: Uses localStorage for better persistence
- **PKCE Flow**: Enhanced security for OAuth flows
- **7-Day Cookie Duration**: Extended session lifetime

### Security

- **HttpOnly Cookies**: Server-side session storage
- **Secure Cookies**: HTTPS-only in production
- **SameSite Protection**: CSRF protection
- **Centralized Error Handling**: Consistent error messages

### User Experience

- **Seamless Authentication**: No unnecessary logouts
- **Activity Tracking**: Monitor user engagement
- **Graceful Error Handling**: User-friendly error messages
- **Development Tools**: Session monitoring for debugging

## Configuration

### Session Settings

```typescript
session: {
  autoRefreshToken: true,        // Automatic refresh
  persistSession: true,          // Cross-tab persistence
  detectSessionInUrl: true,      // OAuth flow support
  flowType: "pkce",             // Enhanced security
  storageKey: "price-lens-auth", // Custom storage key
  refreshInterval: 30 * 60 * 1000, // 30 minutes
}
```

### Cookie Settings

```typescript
cookies: {
  httpOnly: true,               // Server-side only
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",             // CSRF protection
  path: "/",                    // Site-wide access
  maxAge: 60 * 60 * 24 * 7,    // 7 days
}
```

### Protected Routes

```typescript
protectedRoutes: ["/profile", "/admin", "/favorites", "/tracked"]
```

## Usage

### Basic Authentication Check

```typescript
import { useUser } from "@/hooks/useUser"

function MyComponent() {
  const { user, isLoading } = useUser()

  if (isLoading) return <Loading />
  if (!user) return <LoginPrompt />

  return <AuthenticatedContent />
}
```

### Session Information

```typescript
import { useUser } from "@/hooks/useUser"

function SessionInfo() {
  const { getSessionInfo, refreshSession } = useUser()
  const sessionInfo = getSessionInfo()

  return (
    <div>
      <p>Expires in: {sessionInfo?.timeUntilExpiry}</p>
      <button onClick={refreshSession}>Refresh Session</button>
    </div>
  )
}
```

### Route Protection

```typescript
// Middleware automatically handles protected routes
// No additional code needed in components
```

## Development Tools

### Session Monitor

The SessionMonitor component provides real-time debugging information:

- Current authentication status
- Session expiry countdown
- Token presence indicators
- Manual refresh capability
- Activity tracking

**Usage**: Automatically appears on `/profile` page in development mode.

### Debug Logging

Auth state changes are logged in development:

```typescript
// Enable/disable in auth-config.ts
development: {
  enableSessionMonitor: process.env.NODE_ENV === "development",
  logAuthChanges: process.env.NODE_ENV === "development",
}
```

## Troubleshooting

### Common Issues

1. **Session Expires Too Quickly**
   - Check refresh interval configuration
   - Verify automatic refresh is enabled
   - Monitor network connectivity

2. **User Logged Out Unexpectedly**
   - Check browser storage permissions
   - Verify cookie settings
   - Review middleware logs

3. **OAuth Flow Issues**
   - Verify redirect URLs
   - Check PKCE flow configuration
   - Review callback handling

### Debug Steps

1. **Enable Session Monitor**

   ```typescript
   // In auth-config.ts
   development: {
     enableSessionMonitor: true,
     logAuthChanges: true,
   }
   ```

2. **Check Browser Console**
   - Look for auth state change logs
   - Monitor session refresh attempts
   - Review error messages

3. **Verify Configuration**
   - Check all auth settings in `auth-config.ts`
   - Verify environment variables
   - Review Supabase project settings

## Best Practices

### For Developers

1. **Always use the centralized configuration**
2. **Handle loading states properly**
3. **Provide user-friendly error messages**
4. **Test authentication flows thoroughly**

### For Production

1. **Monitor session refresh success rates**
2. **Track authentication errors**
3. **Review security settings regularly**
4. **Test across different browsers/devices**

## Security Considerations

1. **Token Storage**: Access tokens in memory, refresh tokens in secure cookies
2. **HTTPS Only**: All auth cookies require HTTPS in production
3. **CSRF Protection**: SameSite cookies prevent cross-site attacks
4. **Session Rotation**: Regular token refresh limits exposure window

## Performance

1. **Efficient Refresh**: Only refresh when necessary
2. **Minimal Re-renders**: Optimized context updates
3. **Lazy Loading**: Auth components load only when needed
4. **Caching**: Profile data cached appropriately

## Future Enhancements

1. **Multi-factor Authentication**
2. **Session Analytics**
3. **Advanced Security Policies**
4. **Social Login Expansion**

---

This authentication system provides a robust, secure, and user-friendly foundation for Price Lens, following industry best practices and modern web standards.
