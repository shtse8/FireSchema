import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: "FireSchema",
  description: "Strongly-typed Firestore ODM Generator",
  ignoreDeadLinks: true, // Add this line to ignore dead links

  // Theme related configurations.
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Schema Definition', link: '/guide/schema-definition' },
            { text: 'Configuration', link: '/guide/configuration' },
          ]
        },
        {
          text: 'Runtime Guides',
          items: [
            { text: 'TypeScript Client Guide', link: '/guide/typescript-client' },
            { text: 'TypeScript Admin Guide', link: '/guide/typescript-admin' },
            { text: 'Dart Client Guide', link: '/guide/dart-client' },
            { text: 'C# Client Guide', link: '/guide/csharp-client' }, // Added C# Guide
          ]
        },
        {
          text: 'Advanced Topics',
          items: [
             { text: 'Advanced Schema', link: '/guide/advanced-schema' },
             // { text: 'Advanced Usage Patterns', link: '/guide/advanced-usage' }, // Merged into runtime guides
             { text: 'Runtime Libraries Deep Dive', link: '/guide/runtime-libraries' }, // Overview of purpose
             // { text: 'Testing Strategy', link: '/guide/testing-strategy' }, // Merged into runtime guides
          ]
        },
        {
            text: 'Roadmap',
            items: [
                { text: 'Future Targets', link: '/guide/roadmap' }
            ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shtse8/firestore-odm' }
    ],

    footer: {
      message: 'Released under the ISC License.',
      copyright: 'Copyright © 2024-present shtse8'
    },

    search: {
      provider: 'local'
    }
  },

  base: '/FireSchema/', // Base path for GitHub Pages deployment
  outDir: '../docs'
})