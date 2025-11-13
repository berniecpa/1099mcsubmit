# 1099 MC Submit

A simple, modern platform for small businesses to electronically file 1099 tax forms with the IRS using the TaxBandits API.

## Features

- **User-Friendly Interface**: Clean, intuitive design for easy navigation
- **Recipient Management**: Store and manage contractor/vendor information (W-9 data)
- **Multiple Form Types**: Support for 1099-NEC, 1099-MISC, and 1099-K forms
- **IRS E-Filing**: Direct integration with TaxBandits API for electronic filing
- **Status Tracking**: Monitor filing status and acceptance from the IRS
- **Secure**: JWT authentication, encrypted data storage, and secure API communication

## Tech Stack

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database
- **Prisma ORM** for database management
- **TaxBandits API** for IRS filing

### Frontend
- **React** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- TaxBandits API credentials (get a free sandbox account at https://developer.taxbandits.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/1099mcsubmit.git
   cd 1099mcsubmit
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Set up environment variables**

   Backend (.env in `/backend`):
   ```bash
   cp backend/.env.example backend/.env
   ```

   Edit `backend/.env` with your configuration:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/1099mcsubmit?schema=public"
   JWT_SECRET="your-secret-key-change-in-production"
   PORT=3001
   NODE_ENV=development

   # TaxBandits API (Sandbox)
   TAXBANDITS_API_URL="https://testtbs.com/tbsapi"
   TAXBANDITS_USER_TOKEN="your-user-token"
   TAXBANDITS_CLIENT_ID="your-client-id"
   TAXBANDITS_CLIENT_SECRET="your-client-secret"
   ```

4. **Set up the database**
   ```bash
   cd backend
   npx prisma db push
   npx prisma generate
   ```

5. **Start the development servers**
   ```bash
   cd ..
   npm run dev
   ```

   This will start:
   - Backend API on http://localhost:3001
   - Frontend on http://localhost:3000

## Usage

### 1. Register Your Business

Visit http://localhost:3000/register and create an account with your business information:
- Business name and EIN
- Contact information
- Business address

### 2. Add Recipients

Navigate to "Recipients" and add contractors/vendors who will receive 1099 forms:
- Enter information from their W-9 form
- Include TIN (SSN or EIN)
- Add contact details

### 3. Create 1099 Forms

Go to "1099 Forms" > "Create Form":
- Select the form type (NEC, MISC, or K)
- Choose the tax year
- Select a recipient
- Enter payment amounts
- Save as draft

### 4. Submit to IRS

Review your form and click "Submit to IRS":
- Form is validated
- Submitted via TaxBandits API
- Status updates automatically
- Recipient receives their copy

## TaxBandits Integration

### Sandbox Testing

For development and testing:
1. Create a free account at https://developer.taxbandits.com
2. Get your sandbox credentials
3. Use the sandbox API URL: `https://testtbs.com/tbsapi`

### Production

For production filing:
1. Upgrade to a TaxBandits production account
2. Update your credentials in `.env`
3. Change API URL to: `https://api.taxbandits.com`

### Supported Features

- **Form 1099-NEC**: Non-employee compensation (fully implemented)
- **Form 1099-MISC**: Miscellaneous income (schema ready)
- **Form 1099-K**: Payment card transactions (schema ready)
- **TIN Matching**: Validate recipient TINs (available in service)
- **Status Tracking**: Real-time filing status updates

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities:

- **User**: Account credentials
- **Business**: Company information
- **Recipient**: Contractor/vendor W-9 data
- **Form1099**: Tax form details and filing status

To view your database:
```bash
cd backend
npx prisma studio
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new business
- `POST /api/auth/login` - Login

### Business
- `GET /api/business/profile` - Get business profile
- `PUT /api/business/profile` - Update business profile

### Recipients
- `GET /api/recipients` - List all recipients
- `GET /api/recipients/:id` - Get recipient details
- `POST /api/recipients` - Create recipient
- `PUT /api/recipients/:id` - Update recipient
- `DELETE /api/recipients/:id` - Delete recipient

### Forms
- `GET /api/forms1099` - List all forms (with filters)
- `GET /api/forms1099/:id` - Get form details
- `POST /api/forms1099` - Create form draft
- `PUT /api/forms1099/:id` - Update form (draft only)
- `POST /api/forms1099/:id/submit` - Submit to IRS
- `GET /api/forms1099/:id/status` - Check submission status
- `DELETE /api/forms1099/:id` - Delete form (draft only)

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Migrations

```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

### Code Quality

```bash
# Lint backend
cd backend
npm run lint

# Lint frontend
cd frontend
npm run lint
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

### Quick Deploy Summary

1. Set environment variables on your hosting platform
2. Build and deploy backend
3. Run database migrations
4. Build and deploy frontend
5. Configure DNS and SSL

## Security Considerations

- **Never commit** `.env` files
- Use strong passwords and JWT secrets
- Enable HTTPS in production
- Validate all user input
- Sanitize data before database queries
- Keep dependencies updated
- Use rate limiting on API endpoints

## Troubleshooting

See [SETUP.md](SETUP.md) for detailed troubleshooting steps.

### Common Issues

**Database Connection**: Verify PostgreSQL is running and DATABASE_URL is correct

**TaxBandits API Errors**: Check credentials and API URL (sandbox vs production)

**Frontend Not Loading**: Ensure backend is running on port 3001

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- TaxBandits API: https://developer.taxbandits.com/support
- Create an issue in this repository

## Roadmap

- [ ] Add 1099-MISC and 1099-K submission support
- [ ] Batch filing for multiple forms
- [ ] State tax filing
- [ ] PDF generation for recipient copies
- [ ] Email delivery to recipients
- [ ] Payment processing for filing fees
- [ ] Multi-user accounts
- [ ] Tax year summary reports
- [ ] Integration with accounting software

---

Built with ❤️ for small businesses