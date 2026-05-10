// src/pages/legal/DisclaimerPage.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import LegalPage, { Section, P } from './LegalPage';

const DisclaimerPage = () => (
  <>
    <Helmet>
      <title>Disclaimer — Xmaster</title>
      <meta name="description" content="Disclaimer for Xmaster adult video platform." />
      <link rel="canonical" href="https://xmaster.guru/disclaimer" />
    </Helmet>

    <LegalPage title="Disclaimer" lastUpdated="May 2025">
      <Section title="Adult Content Warning">
        <P>This website contains sexually explicit material intended for adults only. If you are under the age of 18 (or the legal age of majority in your jurisdiction, whichever is greater), you must leave this website immediately.</P>
      </Section>

      <Section title="Content Disclaimer">
        <P>All content on this site is provided for entertainment purposes. Xmaster does not produce, host, or own any of the video content displayed. All videos are embedded from third-party hosting services. Xmaster is not responsible for the accuracy, legality, or content of any embedded material.</P>
      </Section>

      <Section title="No Endorsement">
        <P>The inclusion of any content on this site does not constitute an endorsement by Xmaster. We are not responsible for third-party content, websites, or services linked from this site.</P>
      </Section>

      <Section title="Accuracy of Information">
        <P>While we strive to keep information accurate and up to date, we make no warranties about the completeness, reliability, or accuracy of information on this site. Any action you take based on information found on xmaster.guru is strictly at your own risk.</P>
      </Section>

      <Section title="Liability">
        <P>Xmaster and its operators will not be liable for any losses or damages in connection with the use of this website. This includes, without limitation, any direct, indirect, incidental, consequential, or punitive damages.</P>
      </Section>
    </LegalPage>
  </>
);

export default DisclaimerPage;