# 🏎️ Multiplayer Road Fighter

A modern remake of the classic Road Fighter game, designed for the Whop platform with multiplayer capabilities, entry fees, daily tokens, and leaderboards.

## ✨ Features

### 🎮 Game Features
- **Real-time Multiplayer**: Up to 8 players per session
- **Classic Gameplay**: Based on the original Road Fighter mechanics
- **Cross-platform**: Works on desktop and mobile devices
- **WebSocket Communication**: Smooth, low-latency gameplay

### 💰 Monetization
- **Customizable Entry Fees**: $1 - $100 per game
- **Daily Token System**: 3 free tokens per day, 1 token per game
- **Automatic Payment Splits**: 25% developer, 25% creator, 50% winner
- **Whop Platform Integration**: Seamless payment processing

### 🏆 Competition
- **Daily Leaderboards**: Compete for daily prizes
- **Automatic Winner Selection**: Fair and transparent
- **Prize Distribution**: Automated payouts
- **Game History**: Track your performance over time

## 🚀 Quick Start

### For Players
1. Visit the game on Whop platform
2. Join or create a game session
3. Pay entry fee (uses your Whop credits)
4. Use daily tokens to play
5. Compete for daily prizes!

### For Developers

```bash
# Clone repository
git clone <repository-url>
cd multiplayer-road-fighter

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start services
docker compose up -d postgres redis

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000` for the frontend and `http://localhost:3001` for the API.

## 📖 Documentation

- **[Development Guide](DEVELOPMENT.md)** - Comprehensive development documentation
- **[API Documentation](DEVELOPMENT.md#api-documentation)** - Complete API reference
- **[Architecture Guide](memory/docs/architecture.md)** - System architecture details
- **[Product Requirements](memory/docs/product_requirement_docs.md)** - Feature specifications

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **HTML5 Canvas** for game rendering
- **Socket.io Client** for real-time communication
- **Redux Toolkit** for state management
- **Vite** for build tooling

### Backend
- **Node.js** with TypeScript
- **Express.js** web framework
- **Socket.io** for WebSocket communication
- **Prisma ORM** with PostgreSQL
- **Redis** for caching and sessions
- **JWT** for authentication

### Infrastructure
- **PostgreSQL** database
- **Redis** cache
- **Docker** containerization
- **Whop Platform** integration

## 🏗️ Project Structure

```
multiplayer-road-fighter/
├── src/
│   ├── client/          # React frontend
│   ├── server/          # Node.js backend
│   ├── shared/          # Shared types and utilities
│   └── test/            # Test files
├── prisma/              # Database schema
├── memory/              # Project documentation
├── project_rules/       # Development guidelines
└── public/              # Static assets
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## 📊 Current Status

### ✅ Completed
- [x] Project setup and configuration
- [x] Database schema and migrations
- [x] Authentication system
- [x] Basic API structure
- [x] TypeScript configuration
- [x] Docker development environment
- [x] Test framework setup
- [x] Comprehensive documentation

### 🚧 In Progress
- [ ] Whop SDK integration
- [ ] Game engine implementation
- [ ] Real-time multiplayer system
- [ ] Payment processing
- [ ] Leaderboard system

### 📅 Planned
- [ ] Frontend UI development
- [ ] Mobile optimization
- [ ] Production deployment
- [ ] Performance optimization
- [ ] Advanced game features

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](DEVELOPMENT.md#contributing) for:

- Code standards and style guide
- Development workflow
- Testing requirements
- Pull request process

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Game Mechanics

### Original Road Fighter
Based on the classic 1984 Konami game featuring:
- Car racing with obstacle avoidance
- Fuel management system
- Multiple car types (yellow, red, blue, trucks)
- Distance and time scoring

### Multiplayer Enhancements
- Real-time synchronization
- Collision detection
- Fair play mechanisms
- Anti-cheat systems

## 💡 Business Model

### Revenue Streams
1. **Developer Split**: 25% of all entry fees
2. **Platform Integration**: Whop platform commission
3. **Volume-based Growth**: More players = more revenue

### User Benefits
1. **Daily Free Play**: 3 tokens per day
2. **Win Real Money**: 50% of daily prize pool
3. **Fair Competition**: Skill-based gameplay
4. **Community Features**: Leaderboards and social interaction

## 📞 Support

- **Documentation**: Check the [Development Guide](DEVELOPMENT.md)
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Email**: Contact the development team

---

**Built with ❤️ by Terragon Labs**

*Ready to race? Join the competition on Whop!* 🏁