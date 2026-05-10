// src/pages/legal/TermsPage.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import LegalPage, { Section, P, Ul } from './LegalPage';

const TermsPage = () => (
  <>
    <Helmet>
      <title>Terms of Service — Xmaster</title>
      <meta name="description" content="Terms of Service for Xmaster. Read our rules and conditions of use." />
      <link rel="canonical" href="https://xmaster.guru/terms" />
    </Helmet>

    <LegalPage title="Terms of Service" lastUpdated="May 2025">
      <Section title="1. Acceptance of Terms">
        <P>By accessing xmaster.guru you confirm that you are at least 18 years of age and agree to be bound by these Terms of Service. If you do not agree, please leave the site immediately.</P>
      </Section>

      <Section title="2. Age Restriction">
        <P>This website contains adult content and is strictly for adults (18+). By continuing to use this site you represent and warrant that you are of legal age in your jurisdiction to view such content. It is your responsibility to comply with local laws.</P>
      </Section>

      <Section title="3. Permitted Use">
        <Ul items={[
          'You may access and view content for personal, non-commercial use only.',
          'You must not copy, redistribute, or commercially exploit any content on this site.',
          'You must not use automated tools to scrape or harvest content.',
          'You must not attempt to gain unauthorised access to our systems.',
        ]} />
      </Section>

      <Section title="4. Content Policy">
        <P>All content on this site depicts consenting adults. We have a zero-tolerance policy for illegal content. If you believe any content violates these terms, please use the report function or submit a DMCA notice.</P>
      </Section>

      <Section title="5. User-Submitted Content">
        <P>By submitting comments or other content you grant us a non-exclusive, royalty-free licence to display, distribute, and moderate that content. You represent that you own or have the right to submit the content and that it does not violate any third-party rights.</P>
      </Section>

      <Section title="6. Disclaimer of Warranties">
        <P>This site is provided "as is" without warranties of any kind. We do not warrant that the site will be uninterrupted, error-free, or free of viruses or other harmful components.</P>
      </Section>

      <Section title="7. Limitation of Liability">
        <P>To the maximum extent permitted by law, Xmaster shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use this site.</P>
      </Section>

      <Section title="8. Changes to Terms">
        <P>We reserve the right to modify these terms at any time. Continued use of the site constitutes acceptance of any revised terms.</P>
      </Section>

      <Section title="9. Governing Law">
        <P>These terms are governed by applicable law. Any disputes shall be resolved in the appropriate jurisdiction.</P>
      </Section>

      <Section title="10. Contact">
        <P>Questions about these Terms? Contact us at: support@xmaster.guru</P>
      </Section>
    </LegalPage>
  </>
);

export default TermsPage;