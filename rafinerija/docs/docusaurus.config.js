module.exports = {
  title: 'Rafinerija INA',
  tagline: '',
  favicon: 'img/favicon.ico',
  url: 'https://sten.ba',
  baseUrl: '/',
  organizationName: 'facebook',
  projectName: 'docusaurus',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          editUrl:
              'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: false, // Uklanja blog
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: '',
      logo: {
        alt: 'INA Logo',
        src: 'img/inapurple.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Dokumentacija',
        },
      ],
    },
    colorMode: {
      // Isključivanje dugmeta za Light/Dark mode
      disableSwitch: true, // Onemogućava dugme za promjenu teme
    },
  },
};
