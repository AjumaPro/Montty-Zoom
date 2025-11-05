import React, { useState } from 'react';
import { HiChevronDown, HiQuestionMarkCircle, HiBookOpen, HiVideoCamera, HiUserGroup, HiCog6Tooth, HiEnvelope, HiPhone } from 'react-icons/hi2';
import './Help.css';

function Help() {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (sectionId) => {
    setOpenSections({
      ...openSections,
      [sectionId]: !openSections[sectionId]
    });
  };

  const faqSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: HiVideoCamera,
      items: [
        { q: 'How do I create a meeting?', a: 'Click the "Add Meeting" button on the dashboard, fill in the meeting details, and schedule it for your desired time.' },
        { q: 'How do I join a meeting?', a: 'Click the "Join" button in the sidebar, enter the room ID, and optionally provide a password if required.' },
        { q: 'Can I schedule recurring meetings?', a: 'Yes, when creating a meeting, you can enable the recurring option and choose the pattern (daily, weekly, monthly).' }
      ]
    },
    {
      id: 'meetings',
      title: 'Meetings',
      icon: HiUserGroup,
      items: [
        { q: 'How many participants can join a meeting?', a: 'There is no hard limit on the number of participants. The system can handle large meetings efficiently.' },
        { q: 'Can I record meetings?', a: 'Yes, meeting hosts can start recording from the meeting controls panel.' },
        { q: 'How do I share my screen?', a: 'Click the "Share screen" button in the sidebar or use the screen share option in the meeting room.' }
      ]
    },
    {
      id: 'settings',
      title: 'Settings & Account',
      icon: HiCog6Tooth,
      items: [
        { q: 'How do I change my profile information?', a: 'Go to Settings from the sidebar, update your profile information, and click "Save Changes".' },
        { q: 'Can I customize notifications?', a: 'Yes, in Settings > Notifications, you can toggle different types of notifications on or off.' },
        { q: 'How do I enable two-factor authentication?', a: 'Go to Settings > Security and toggle on Two-Factor Authentication.' }
      ]
    }
  ];

  return (
    <div className="help-page">
      <div className="help-header">
        <div>
          <h1 className="page-title">Help & Support</h1>
          <p className="page-subtitle">Find answers to common questions and learn how to use Montty Zoom</p>
        </div>
      </div>

      <div className="help-content">
        <div className="help-categories">
          <div className="category-card">
            <HiQuestionMarkCircle className="category-icon" />
            <h3>FAQs</h3>
            <p>Frequently asked questions</p>
          </div>
          <div className="category-card">
            <HiBookOpen className="category-icon" />
            <h3>Documentation</h3>
            <p>Detailed guides and tutorials</p>
          </div>
          <div className="category-card">
            <HiVideoCamera className="category-icon" />
            <h3>Video Tutorials</h3>
            <p>Step-by-step video guides</p>
          </div>
        </div>

        <div className="faq-section">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          {faqSections.map(section => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="faq-group">
                <button
                  className="faq-group-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <Icon className="faq-icon" />
                  <span className="faq-group-title">{section.title}</span>
                  <HiChevronDown className={`faq-chevron ${openSections[section.id] ? 'open' : ''}`} />
                </button>
                {openSections[section.id] && (
                  <div className="faq-items">
                    {section.items.map((item, index) => (
                      <div key={index} className="faq-item">
                        <h4 className="faq-question">{item.q}</h4>
                        <p className="faq-answer">{item.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="contact-section">
          <h2 className="contact-title">Still Need Help?</h2>
          <p className="contact-description">If you can't find what you're looking for, feel free to reach out to our support team.</p>
          <div className="contact-options">
            <button className="contact-btn">
              <HiEnvelope className="contact-icon" />
              Email Support
            </button>
            <button className="contact-btn">
              <HiPhone className="contact-icon" />
              Call Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Help;

