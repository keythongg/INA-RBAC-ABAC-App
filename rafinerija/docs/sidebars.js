// @ts-check

/**
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'html',
      value: `
       <div id="version-select-wrapper">
  <select id="version-select">
    <option value="v1.0.0">v1.0.0</option>
  </select>
</div>
      `,
    },
    {
      type: 'category',
      label: 'Uvod',
      items: [
        { type: 'doc', id: 'intro', label: 'Pregled projekta' },
        { type: 'doc', id: 'features', label: 'Ključne funkcionalnosti' },
      ],
    },
    {
      type: 'category',
      label: 'Početak rada',
      items: [
        { type: 'doc', id: 'vodic/pre-requisites', label: 'Preduslovi' },
        { type: 'doc', id: 'vodic/installation', label: 'Instalacija' },
        { type: 'doc', id: 'vodic/running-application', label: 'Pokretanje aplikacije' },
      ],
    },
    {
      type: 'doc',
      id: 'struktura/project-structure',
      label: 'Arhitektura projekta',
    },

    {
      type: 'category',
      label: 'Backend',
      items: [
        { type: 'doc', id: 'backend/technologies', label: 'Tehnologije i biblioteke' },
        { type: 'doc', id: 'backend/database', label: 'Baza podataka' },
        { type: 'doc', id: 'backend/data-structure', label: 'Struktura podataka' },
        { type: 'doc', id: 'backend/working-with-db', label: 'Rad sa bazom' },
      ],
    },
    {
      type: 'category',
      label: 'API Dokumentacija',
      items: [
        { type: 'doc', id: 'api/endpoints', label: 'API endpointi' },
        { type: 'doc', id: 'api/routes-overview', label: 'Pregled dostupnih ruta' },
/** { type: 'doc', id: 'api/usage-examples', label: 'Primjeri korištenja' },  */
      ],
    },
    {
      type: 'category',
      label: 'Konfiguracija',
      items: [
        { type: 'doc', id: 'config/database-security', label: 'Postavke baze podataka' },
        { type: 'doc', id: 'config/server-configuration', label: 'Konfiguracija servera' },
      ],
    },

    /** {
      type: 'doc',
      id: 'deployment/server-setup',
      label: 'Deployment',
    },*/
    /**  {
      type: 'doc',
      id: 'security/user-management',
      label: 'Sigurnost i autorizacija',
    },*/

    {
      type: 'doc',
      id: 'extra/future-plans',
      label: 'Roadmap',
    },

  ],
};

export default sidebars;
