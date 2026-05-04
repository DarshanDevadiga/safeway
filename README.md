# Vehicle Accident Detection Alert System

A modern, real-time vehicle accident detection system built with Node.js, Express, MongoDB, and Tailwind CSS. The system uses IoT sensors to detect accidents and automatically sends alerts to emergency contacts.

## 🚀 Features

- **Real-time Accident Detection**: Uses IoT sensors (ESP32, MPU-6500 accelerometer, GPS/GSM modules)
- **Live Dashboard**: Real-time monitoring with statistics and system status
- **Interactive Maps**: Live GPS tracking with accident locations
- **Emergency Alerts**: Automatic SMS alerts to pre-configured contacts
- **Modern UI**: Responsive design with Tailwind CSS and glassmorphism effects
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **API Rate Limiting**: Protection against abuse and DDoS attacks
- **Data Visualization**: Live sensor data charts and analytics
- **Mobile Responsive**: Works seamlessly on all devices

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **express-rate-limit** - API protection

### Frontend
- **EJS** - Template engine
- **Tailwind CSS** - Utility-first CSS framework
- **Font Awesome** - Icons
- **Chart.js** - Data visualization
- **Leaflet** - Interactive maps

### IoT Hardware
- **ESP32** - Microcontroller
- **MPU-6500** - Accelerometer/Gyroscope
- **GPS/GSM Module** - Location tracking and communication

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd safeway
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/accident_detection
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

4. **Build CSS**
   ```bash
   npm run build
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

6. **Start the application**
   ```bash
   # For development
   npm run dev
   
   # For production
   npm start
   ```

## 🎯 Usage

### Access the Application
- Open your browser and navigate to `http://localhost:5000`
- Login with demo credentials:
  - Username: `admin`
  - Password: `12345`

### Main Features

1. **Dashboard**: Overview of system status and statistics
2. **Live Sensors**: Real-time sensor data visualization
3. **GPS Map**: Live tracking and accident locations
4. **Emergency Alerts**: View and manage accident alerts
5. **Project Report**: System documentation and hardware setup

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

#### Alerts
- `GET /api/alerts` - Get all alerts (with pagination and filtering)
- `POST /api/alerts` - Create new alert (IoT device endpoint)
- `GET /api/alerts/:id` - Get specific alert
- `PUT /api/alerts/:id` - Update alert status
- `DELETE /api/alerts/:id` - Delete alert
- `GET /api/alerts/stats/summary` - Get alert statistics

## 🔧 Configuration

### Tailwind CSS Development
For development with live CSS compilation:
```bash
npm run build-css  # Watches for changes and compiles CSS
```

### Production Build
For production deployment:
```bash
npm run build  # Minifies CSS for production
```

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Input Validation**: All inputs are validated and sanitized
- **CORS Protection**: Cross-origin requests are properly configured

## 🚨 Emergency Alert System

When an accident is detected:
1. IoT device sends alert data to the server
2. Server processes the alert and stores it in the database
3. SMS alerts are sent to emergency contacts
4. Real-time updates are pushed to the web dashboard
5. Emergency services can view the exact location on the map

## 📊 Monitoring and Analytics

- Real-time sensor data visualization
- Accident statistics and trends
- System health monitoring
- GPS location tracking
- Emergency response time tracking

## 🛡️ Error Handling

The system includes comprehensive error handling:
- Database connection errors
- API request validation
- IoT device communication errors
- Frontend error reporting
- Graceful degradation

## 🔄 Real-time Updates

The dashboard updates in real-time using:
- Server-sent events for instant notifications
- Auto-refreshing data tables
- Live sensor data streaming
- Real-time map updates

## 📈 Performance Optimization

- Efficient database queries with indexing
- CSS minification for production
- Image optimization
- API response caching
- Lazy loading for large datasets

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically

### Traditional Server
1. Build the project: `npm run build`
2. Set up production environment variables
3. Start with: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Check the error logs
- Contact the development team

## 🔄 Version History

- **v2.0.0** - Modern UI with Tailwind CSS, enhanced security, real-time features
- **v1.0.0** - Initial release with basic functionality

---

**⚠️ Important**: This is a demonstration system. For production use, ensure proper security measures, regular updates, and compliance with local regulations for emergency alert systems.
