# 🌱 FarmPulse

A smart agricultural weather dashboard powered by the WeatherAI API.

FarmPulse gives farmers real-time weather insights, 7-day forecasts with AI summaries, context-aware crop advisories, and an AI-powered farm canopy analyzer — all in one clean interface.

![FarmPulse Screenshot](https://via.placeholder.com/960x540?text=FarmPulse+Screenshot)
 Live Demo

🔗 [farmpulse.netlify.app](https://farmpulse.netlify.app)**

 Features

| Feature | WeatherAI Endpoint | Description |
|---|---|---|
| Auto-detect location | `GET /v1/weather-geo` | Detects your location from IP on load |
| Current weather | `GET /v1/weather` | Temperature, humidity, wind, UV, visibility |
| AI weather summary | Built into `/v1/weather` | Gemini-powered natural language summary |
| 7-day forecast | `GET /v1/weather` | Daily highs/lows, rain probability, condition icons |
| Crop advisories | Derived from weather data | Fungal risk, spray windows, frost alerts, and more |
| Farm canopy analyzer | `POST /v1/trees/analyze` | Upload drone/satellite image → tree count, health breakdown, AI recommendations |
| Location search | Nominatim geocoding | Search any city and fetch its weather instantly |

---

## Tech Stack

- **React 18** + **TypeScript** — type-safe component architecture
- **Vite** — fast dev server and production builds
- **WeatherAI API** — weather, geo-detection, and tree CV analysis
- **Lucide React** — icons
- **Syne + DM Sans** — Google Fonts
- **Netlify** — deployment

---

## Local Setup

### Prerequisites

- Node.js 18+
- A free WeatherAI API key from [weather-ai.co](https://weather-ai.co/dashboard)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/farmpulse.git
cd farmpulse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and add your WeatherAI API key:

```env
VITE_WEATHERAI_API_KEY=wai_your_key_here
```



### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for production

```bash
npm run build
```

The production bundle is output to `dist/`.

---

## Deployment

### Netlify 



The `netlify.toml` in this repo handles all routing automatically.

### Vercel

```bash
npm install -g vercel
vercel
```

Set `VITE_WEATHERAI_API_KEY` in the Vercel dashboard under **Settings → Environment Variables**.

---

## Project Structure

```
farmpulse/
├── src/
│   ├── components/
│   │   ├── CurrentWeatherCard.tsx   # Hero weather display
│   │   ├── ForecastStrip.tsx        # 7-day forecast grid
│   │   ├── CropAdvisoryPanel.tsx    # Derived farming advisories
│   │   ├── TreeAnalyzer.tsx         # Image upload + canopy analysis
│   │   └── LocationSearch.tsx       # Search bar + auto-detect
│   ├── hooks/
│   │   ├── useWeather.ts            # Weather data fetching hook
│   │   └── useTreeAnalysis.ts       # Tree analysis upload hook
│   ├── types/
│   │   └── index.ts                 # Full TypeScript types for all API responses
│   ├── utils/
│   │   ├── api.ts                   # WeatherAI API client class
│   │   └── advisories.ts            # Crop advisory logic + weather helpers
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Entry point
│   └── styles.css                   # Full design system
├── .env.example
├── netlify.toml
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## API Integration Notes

### WeatherAI endpoints used

```typescript
// Auto-detect location + fetch weather
GET /v1/weather-geo?ip=auto

// Fetch weather by coordinates (after location search)
GET /v1/weather?lat={lat}&lon={lon}&days=7&units=metric

// Analyze farm image
POST /v1/trees/analyze  (multipart/form-data)
```

### API key security

The API key is stored in a Vite environment variable (`VITE_WEATHERAI_API_KEY`) and is only included in the client bundle. For production applications requiring stricter key security, proxy requests through a backend server (e.g. an Express app on Render or a Next.js API route) so the key is never exposed in client-side code.

---

## License

MIT
