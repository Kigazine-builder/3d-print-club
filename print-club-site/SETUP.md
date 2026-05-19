# PrintForge Club Setup

## What this site does
- People create an account and submit a membership request.
- The club owner opens `admin.html` and approves or rejects requests.
- Approval generates a member code.
- Approved members see their code in `member.html`.
- Members order products from `shop.html` using their code.
- Products and orders are stored in Firestore.
- The owner creates products and manages orders in the admin page.

## Files
- `index.html` - homepage
- `login.html` - login + signup request form
- `member.html` - status, code, and order history
- `shop.html` - product catalog and order forms
- `admin.html` - owner dashboard
- `firebase-config.js` - paste Firebase config and owner email here
- `firestore.rules` - Firestore security rules

## Firebase setup
1. Create a Firebase project.
2. Add a Web App.
3. Copy the Firebase config into `firebase-config.js`.
4. In Firebase Authentication, enable Email/Password.
5. Create Firestore Database.
6. Paste `firestore.rules` into Firestore > Rules.
7. Replace `owner@example.com` in BOTH:
   - `firebase-config.js`
   - `firestore.rules`
8. Publish the site with GitHub Pages.

## First owner login
1. Open `login.html`.
2. Sign up using the exact owner email you configured.
3. Because the owner account starts as pending, go to Firestore > users and manually change that owner's document:
   - `membershipStatus`: `approved`
   - `memberCode`: `OWNER-ADMIN`
4. Then open `admin.html`.

## Firestore collections
### users/{uid}
- uid
- name
- email
- reason
- role
- membershipStatus: pending / approved / rejected
- memberCode
- createdAt
- approvedAt

### products/{productId}
- name
- icon
- category
- description
- active
- createdAt

### orders/{orderId}
- userId
- userName
- userEmail
- memberCode
- productId
- productName
- quantity
- notes
- status: ordered / ready / cancelled
- createdAt

## Important
The code field is NOT a payment system. It is a club membership authorization code.
