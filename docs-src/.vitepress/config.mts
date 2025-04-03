import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: "FireSchema",
  description: "Strongly-typed Firestore ODM Generator",

  // Theme related configurations.
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API', link: '/api/' } // Placeholder for API docs if needed later
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Schema Definition', link: '/guide/schema-definition' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Usage Examples', link: '/guide/usage-examples' },
            // Add more guide pages here
          ]
        }
      ],
       '/api/': [ // Placeholder
        {
          text: 'API Reference',
          items: [
            // API links will go here
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shtse8/firestore-odm' } // Replace with actual repo link if different
    ],

    footer: {
      message: 'Released under the ISC License.',
      copyright: 'Copyright © 2024-present shtse8' // Update year/name if needed
    },

    // Optional: Add search functionality
    search: {
      provider: 'local'
    }
  },

  // Base URL for GitHub Pages deployment
  base: '/firestore-odm/', // IMPORTANT: Set this to your repository name

  // Output directory relative to docs-src
  outDir: '../docs' // Output to the root /docs directory
})