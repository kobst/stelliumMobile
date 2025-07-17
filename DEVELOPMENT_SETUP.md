# Development Setup - Hardcoded User Authentication

This setup allows you to bypass Firebase authentication and work with real backend data using a hardcoded userId.

## What Was Changed

### 1. Added Backend Type Definitions (`src/types/index.ts`)
- Added `SubjectDocument` interface matching backend response
- Added supporting interfaces for birth chart data
- Added all planet, sign, and aspect type definitions

### 2. Updated User Transformer (`src/transformers/user.ts`)
- Added `subjectDocumentToUser()` function
- Transforms backend `SubjectDocument` to frontend `User` format
- Handles field mapping like `_id` → `id`, `firstName + lastName` → `name`

### 3. Modified App.tsx
- **Commented out** Firebase authentication (easy to restore)
- Added hardcoded userId initialization
- Fetches real user data from backend on app start
- Transforms and stores data in the app store

### 4. Updated API (`src/api/users.ts`)
- Changed `getUser()` return type to `SubjectDocument`
- Now properly typed for backend response

### 5. Created Documentation
- `API_GUIDE.md`: Complete backend interface documentation
- `DEVELOPMENT_SETUP.md`: This file

## How to Use

1. **Replace the hardcoded userId** in `App.tsx` line 30:
   ```typescript
   const HARDCODED_USER_ID = 'your-actual-user-id-from-backend';
   ```
   
2. **Get a real userId** from your backend:
   - Look in your database for a `SubjectDocument` with `kind: "accountSelf"`
   - Use the `_id` field value (MongoDB ObjectId as string)

3. **Start the app**:
   ```bash
   npm start
   npm run android  # or npm run ios
   ```

## What Happens

1. App starts and immediately calls `usersApi.getUser(HARDCODED_USER_ID)`
2. Backend returns a `SubjectDocument` with complete birth chart data
3. Data is transformed to frontend `User` format
4. Store is populated with real data including `birthChart`
5. Navigation sees `userData.birthChart` exists and goes to main dashboard
6. All other APIs work normally using the userId from the store

## Expected Flow

✅ **Skip Auth Screen** → **Skip Onboarding** → **Go directly to TabNavigator**

All dashboard screens should now load with real data:
- Horoscopes from `horoscopesApi`
- Charts from `chartsApi` 
- Relationships from `relationshipsApi`
- User subjects from `usersApi.getUserSubjects`

## Reverting to Firebase Auth

To restore Firebase authentication later:

1. In `App.tsx`, uncomment the Firebase auth code (lines 65-87)
2. Comment out the hardcoded initialization (lines 90)
3. Remove the hardcoded imports at the top

## Error Handling

If the hardcoded userId is invalid:
- The app will catch the error and show the AuthScreen
- Check the console logs for error details
- Verify the userId exists in your backend database

## Data Verification

Check the console logs to see:
- The raw `SubjectDocument` from backend
- The transformed `User` object  
- Navigation decisions based on `birthChart` presence

This setup gives you a production-like experience while working on the main app features.