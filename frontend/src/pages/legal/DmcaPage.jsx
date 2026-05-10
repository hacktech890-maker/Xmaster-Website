// src/pages/legal/DmcaPage.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import LegalPage, { Section, P, Ul } from './LegalPage';

const DmcaPage = () => (
  <>
    <Helmet>
      <title>DMCA / Copyright Policy — Xmaster</title>
      <meta name="description" content="DMCA and copyright removal policy for Xmaster. Submit takedown requests here." />
      <link rel="canonical" href="https://xmaster.guru/dmca" />
    </Helmet>

    <LegalPage title="DMCA / Copyright Policy" lastUpdated="May 2025">
      <Section title="Our Policy">
        <P>Xmaster respects the intellectual property rights of others. We comply with the Digital Millennium Copyright Act (DMCA) and respond promptly to valid takedown notices. Upon receiving a valid DMCA notice we will remove or disable access to the allegedly infringing content.</P>
      </Section>

      <Section title="Submitting a DMCA Notice">
        <P>To submit a copyright infringement notice, send an email to support@xmaster.guru with the subject line "DMCA Takedown Request" and include all of the following:</P>
        <Ul items={[
          'Your name, address, phone number, and email address.',
          'A description of the copyrighted work you claim has been infringed.',
          'The URL(s) of the specific content you believe infringes your copyright.',
          'A statement that you have a good faith belief that use of the material is not authorised by the copyright owner, its agent, or the law.',
          'A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorised to act on behalf of the copyright owner.',
          'Your electronic or physical signature.',
        ]} />
      </Section>

      <Section title="Counter-Notification">
        <P>If you believe that content was incorrectly removed due to a DMCA notice, you may submit a counter-notification to support@xmaster.guru with the following information:</P>
        <Ul items={[
          'Your name, address, phone number, and email address.',
          'Identification of the content that was removed and the location where it appeared before removal.',
          'A statement under penalty of perjury that you have a good faith belief the content was removed as a result of mistake or misidentification.',
          'Your consent to the jurisdiction of the relevant federal court.',
          'Your electronic or physical signature.',
        ]} />
      </Section>

      <Section title="Repeat Infringers">
        <P>We maintain a policy of terminating accounts of users who are determined to be repeat infringers.</P>
      </Section>

      <Section title="Contact">
        <P>DMCA notices: support@xmaster.guru</P>
      </Section>
    </LegalPage>
  </>
);

export default DmcaPage;