# MySnippetHub 📝

A modern, full-stack snippet management application built with React, Node.js, Express, and SQLite.

![MySnippetHub](https://img.shields.io/badge/version-1.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node.js](https://img.shields.io/badge/node.js-v21.2.0-green)
![React](https://img.shields.io/badge/react-19.1.1-blue)

## ✨ Features

### 🎯 Core Functionality
- **Snippet Management**: Create, read, update, and delete code snippets
- **Advanced Search**: Live search across titles, content, languages, and tags
- **Tagging System**: Organize snippets with custom tags and smart suggestions
- **Favorites**: Bookmark your most-used snippets
- **Version History**: Track changes with automatic versioning and rollback capability
- **Multi-language Support**: Syntax highlighting for JavaScript, Python, Rust, CSS, HTML, SQL, and more

### 🎨 Modern UI/UX
- **Dark Theme**: Beautiful dark interface with teal/cyan and purple accents
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Real-time Search**: Debounced search with instant results
- **Interactive Cards**: Hover effects and smooth animations
- **Toast Notifications**: User-friendly feedback for all actions

### 📊 Analytics & Insights
- **Usage Statistics**: Track snippet creation and usage patterns
- **Language Distribution**: Visual breakdown of your coding languages
- **Tag Analytics**: Popular tags and usage metrics
- **Activity Tracking**: Recent changes and trends

### 🔧 Technical Features
- **REST API**: Complete RESTful backend with validation
- **Database Management**: SQLite with automatic schema initialization
- **Error Handling**: Comprehensive error handling and recovery
- **CORS Support**: Configured for development and production
- **Version Control Ready**: Git initialized with proper .gitignore

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ (recommended v21.2.0)
- **npm** v9+ (recommended v10.2.3)
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd MySnippetHub
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (concurrently for dev)
   npm install
   
   # Install all dependencies (frontend + backend)
   npm run install:all
   ```

3. **Environment Setup**
   ```bash
   # Backend environment (already configured)
   cp backend/.env.example backend/.env
   
   # Frontend environment (already configured)
   cp frontend/.env.example frontend/.env
   ```

4. **Start Development Servers**
   ```bash
   # Start both frontend and backend simultaneously
   npm run dev
   ```

   Or start them separately:
   ```bash
   # Terminal 1: Backend (API server)
   npm run backend:dev
   
   # Terminal 2: Frontend (React app)
   npm run frontend:dev
   ```

5. **Access the Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5001
   - **Health Check**: http://localhost:5001/health

## 📁 Project Structure

```
MySnippetHub/
├── README.md
├── package.json                 # Root package with scripts
├── .gitignore                  # Git ignore rules
│
├── backend/                    # Express.js API Server
│   ├── src/
│   │   ├── index.js           # Server entry point
│   │   ├── db.js              # SQLite database connection
│   │   └── routes/            # API route handlers
│   │       ├── snippets.js    # Snippet CRUD + versions
│   │       ├── tags.js        # Tag management
│   │       ├── favorites.js   # Favorites system
│   │       └── analytics.js   # Usage analytics
│   ├── package.json
│   ├── .env                   # Backend config
│   └── database.sqlite        # SQLite database (auto-created)
│
├── frontend/                  # React Application
│   ├── src/
│   │   ├── App.js            # Main app component
│   │   ├── theme.css         # Dark theme + design system
│   │   ├── components/       # React components
│   │   │   ├── Dashboard.js  # Main dashboard
│   │   │   └── Navbar.js     # Navigation bar
│   │   ├── api/              # API service layer
│   │   │   └── index.js      # Backend communication
│   │   └── utils/            # Utility functions
│   │       └── index.js      # Helpers & formatters
│   ├── package.json
│   └── .env                  # Frontend config
│
└── db/                       # Database Schema & Seeds
    ├── schema.sql            # SQLite table definitions
    └── seed.sql              # Sample data
```

## 🛠️ Development

### Available Scripts

**Root Level:**
- `npm run dev` - Start both frontend and backend
- `npm run install:all` - Install all dependencies
- `npm run backend:dev` - Start backend only
- `npm run frontend:dev` - Start frontend only
- `npm run backend:start` - Start backend in production
- `npm run frontend:build` - Build frontend for production

**Backend Scripts:**
- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start in production mode
- `npm test` - Run tests (when implemented)

**Frontend Scripts:**
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run React tests
- `npm run eject` - Eject from Create React App

### Database

The application uses **SQLite** for simplicity and portability:

- **Auto-initialization**: Database and tables created automatically
- **Sample Data**: Includes example snippets for JavaScript, Python, Rust, CSS
- **Location**: `backend/database.sqlite`
- **Schema**: Defined in `db/schema.sql`

#### Database Tables:
- `snippets` - Main snippet storage
- `tags` - Tag definitions with colors
- `snippet_tags` - Many-to-many relationship
- `favorites` - User favorites
- `versions` - Snippet version history

## 🎨 Design System

### Color Palette
```css
/* Dark Theme */
--bg-primary: #0f0f0f      /* Main background */
--bg-secondary: #1a1a1a    /* Cards, navbar */
--bg-tertiary: #2a2a2a     /* Inputs, hovers */

/* Accent Colors */
--accent-primary: #00d4ff   /* Bright cyan */
--accent-secondary: #8b5cf6 /* Purple */

/* Text */
--text-primary: #ffffff     /* Main text */
--text-secondary: #b3b3b3   /* Secondary text */
--text-muted: #888888       /* Muted text */
```

### Typography
- **Primary Font**: Inter, system fonts
- **Code Font**: JetBrains Mono, Fira Code, Monaco

### Components
- **Buttons**: Gradient backgrounds with hover effects
- **Cards**: Subtle gradients with transform animations
- **Inputs**: Focus states with accent color borders
- **Badges**: Language and tag indicators

## 🔌 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Endpoints

#### Snippets
- `GET /snippets` - Get all snippets (with filtering)
- `GET /snippets/:id` - Get single snippet
- `POST /snippets` - Create new snippet
- `PUT /snippets/:id` - Update snippet
- `DELETE /snippets/:id` - Delete snippet
- `GET /snippets/:id/versions` - Get version history
- `POST /snippets/:id/rollback` - Rollback to version
- `GET /snippets/:id/diff/:version` - Get diff comparison

#### Tags
- `GET /tags` - Get all tags with usage counts
- `GET /tags/suggestions` - Get tag suggestions
- `POST /tags` - Create new tag
- `PUT /tags/:id` - Update tag
- `DELETE /tags/:id` - Delete tag

#### Favorites
- `GET /favorites` - Get favorite snippets
- `POST /favorites/:id` - Add to favorites
- `DELETE /favorites/:id` - Remove from favorites
- `POST /favorites/toggle/:id` - Toggle favorite status

#### Analytics
- `GET /analytics` - Get comprehensive analytics
- `GET /analytics/languages` - Language statistics
- `GET /analytics/trends` - Usage trends
- `GET /analytics/search-insights` - Search insights

### Request Examples

**Create Snippet:**
```json
POST /api/snippets
{
  "title": "React useState Hook",
  "content": "const [count, setCount] = useState(0);",
  "language": "javascript",
  "tags": ["React", "Hooks", "State"],
  "source": "React Documentation"
}
```

**Search Snippets:**
```
GET /api/snippets?search=react&language=javascript&tag=hooks&favorites=true
```

## 🌟 Key Features Walkthrough

### 1. **Smart Search**
- Real-time search with 300ms debounce
- Searches across title, content, language, and tags
- Filter by language, tags, and favorites
- Sort by creation date, modification date, or title

### 2. **Version Control**
- Automatic version creation on content changes
- View complete version history
- Diff comparison between versions
- One-click rollback to previous versions

### 3. **Intelligent Tagging**
- Auto-suggest tags based on content analysis
- Language-specific keyword detection
- Popular tag recommendations
- Custom color coding for tags

### 4. **Advanced Analytics**
- Language distribution charts
- Usage trends and patterns
- Most popular tags and snippets
- Search insights and optimization tips

### 5. **Modern UI/UX**
- Dark theme with accessibility in mind
- Smooth animations and transitions
- Mobile-first responsive design
- Toast notifications for user feedback

## 🚀 Deployment

### Production Build

1. **Build Frontend:**
   ```bash
   npm run frontend:build
   ```

2. **Start Backend:**
   ```bash
   npm run backend:start
   ```

3. **Serve Frontend:**
   - Serve the `frontend/build` folder with a web server
   - Configure API proxy to backend server

### Environment Variables

**Backend (.env):**
```env
PORT=5001
NODE_ENV=production
DB_PATH=./database.sqlite
CORS_ORIGIN=https://your-frontend-domain.com
```

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_APP_NAME=MySnippetHub
REACT_APP_VERSION=1.0.0
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex logic
- Update README for new features
- Test your changes thoroughly

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Create React App** for the React setup
- **Express.js** for the robust backend framework
- **SQLite** for the lightweight database
- **Prism.js** for syntax highlighting
- **Inter Font** for beautiful typography

## 🐛 Issues & Support

If you encounter any issues or need support:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Attach relevant logs or screenshots

## 🔮 Roadmap

### Version 1.1 (Upcoming)
- [ ] Advanced snippet editor with live preview
- [ ] Export/import functionality (JSON, Markdown)
- [ ] Collaboration features (sharing snippets)
- [ ] Plugin system for custom languages

### Version 1.2 (Future)
- [ ] AI-powered snippet suggestions
- [ ] Integration with GitHub Gists
- [ ] Advanced analytics dashboard
- [ ] PWA support for offline usage

---

**Built with ❤️ by Tom Vervecken**

*Happy coding! 🎉*