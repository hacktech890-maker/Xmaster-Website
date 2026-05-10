// src/pages/legal/PrivacyPage.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import LegalPage, { Section, P, Ul } from './LegalPage';

const PrivacyPage = () => (
  <>
    <Helmet>
      <title>Privacy Policy — Xmaster</title>
      <meta name="description" content="Privacy Policy for Xmaster. Learn how we collect, use, and protect your data." />
      <link rel="canonical" href="https://xmaster.guru/privacy" />
    </Helmet>

    <LegalPage title="Privacy Policy" lastUpdated="May 2025">
      <Section title="1. Introduction">
        <P>Xmaster ("we", "us", "our") operates xmaster.guru. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this policy carefully. By using the site you agree to the terms herein.</P>
      </Section>

      <Section title="2. Information We Collect">
        <P>We may collect the following types of information:</P>
        <Ul items={[
          'Log data: IP address, browser type, pages visited, timestamps — collected automatically.',
          'Usage data: video views, search queries, interaction events — used to improve recommendations.',
          'Cookies and similar tracking technologies for session management and analytics.',
          'Information you voluntarily submit via contact or comment forms.',
        ]} />
      </Section>

      <Section title="3. How We Use Your Information">
        <Ul items={[
          'To operate and maintain the website.',
          'To analyse usage patterns and improve our service.',
          'To serve relevant advertisements via third-party ad networks.',
          'To respond to your inquiries and support requests.',
          'To detect and prevent fraudulent or abusive activity.',
        ]} />
      </Section>

      <Section title="4. Third-Party Advertising">
        <P>We use third-party advertising companies to serve ads on our site. These companies may use cookies and web beacons to measure the effectiveness of ads and to personalise ad content. These companies operate under their own privacy policies. We do not control or have access to any information collected by these companies.</P>
      </Section>

      <Section title="5. Cookies">
        <P>We use cookies to remember your session and preferences. You can disable cookies in your browser settings; however, some features of the site may not function correctly without them.</P>
      </Section>

      <Section title="6. Data Retention">
        <P>We retain log data for up to 90 days. User-submitted data (comments, contact form submissions) is retained until you request deletion or we determine it is no longer necessary.</P>
      </Section>

      <Section title="7. Third-Party Links">
        <P>Our site may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites.</P>
      </Section>

      <Section title="8. Children's Privacy">
        <P>This site is intended for adults aged 18 and over. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, contact us immediately and we will delete it.</P>
      </Section>

      <Section title="9. Your Rights">
        <P>Depending on your jurisdiction you may have the right to access, correct, or delete your personal data. To exercise these rights, contact us at support@xmaster.guru.</P>
      </Section>

      <Section title="10. Changes to This Policy">
        <P>We reserve the right to update this Privacy Policy at any time. Continued use of the site after changes constitutes acceptance of the revised policy.</P>
      </Section>

      <Section title="11. Contact">
        <P>For privacy-related queries contact us at: support@xmaster.guru</P>
      </Section>
    </LegalPage>
  </>
);

export default PrivacyPage;