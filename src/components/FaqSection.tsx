import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { faqs } from '../data/faqs'

function FaqSection() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  }

  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <script type="application/ld+json">
        {JSON.stringify(structuredData).replaceAll('<', '\\u003c')}
      </script>
      <div className="faq-heading">
        <div>
          <span className="eyebrow">SUPPORT / Q&amp;A</span>
          <h2 id="faq-title">よくある質問</h2>
        </div>
        <p>気になる質問を選ぶと回答を確認できます。</p>
      </div>
      <div className="faq-list">
        {faqs.map(({ question, answer }, index) => {
          const headingId = `faq-heading-${index}`
          const contentId = `faq-content-${index}`

          return (
            <Accordion
              className="faq-item"
              disableGutters
              elevation={0}
              key={question}
              slotProps={{ heading: { component: 'h3' } }}
            >
              <AccordionSummary
                aria-controls={contentId}
                expandIcon={<ExpandMoreRoundedIcon aria-hidden="true" />}
                id={headingId}
              >
                <span className="faq-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span>{question}</span>
              </AccordionSummary>
              <AccordionDetails id={contentId} aria-labelledby={headingId}>
                <p>{answer}</p>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </div>
    </section>
  )
}

export default FaqSection
