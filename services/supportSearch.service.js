import SupportTicket from '../models/SupportTicket.model.js';
import SupportMessage from '../models/SupportMessage.model.js';
import FAQ from '../models/FAQ.model.js';
import KnowledgeBase from '../models/KnowledgeBase.model.js';
import Guide from '../models/Guide.model.js';

export const performGlobalSearch = async (keyword, userId = null, isAdmin = false) => {
  const searchRegex = new RegExp(keyword, 'i');
  
  const results = {
    tickets: [],
    faqs: [],
    knowledgeBase: [],
    guides: []
  };

  // 1. Search Tickets
  const ticketQuery = {
    $or: [
      { subject: searchRegex },
      { description: searchRegex },
      { ticketNumber: searchRegex },
      { category: searchRegex }
    ]
  };

  // Customers only see their own tickets
  if (!isAdmin && userId) {
    ticketQuery.user = userId;
  }

  results.tickets = await SupportTicket.find(ticketQuery)
    .select('ticketNumber subject description category status priority createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

  // 2. Search FAQs
  const faqQuery = {
    $or: [
      { question: searchRegex },
      { answer: searchRegex },
      { category: searchRegex }
    ]
  };
  
  // Public users only see active items
  if (!isAdmin) faqQuery.status = 'active';

  results.faqs = await FAQ.find(faqQuery)
    .select('question answer category status')
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(10);

  // 3. Search Knowledge Base
  const kbQuery = {
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { content: searchRegex },
      { tags: searchRegex },
      { category: searchRegex }
    ]
  };

  if (!isAdmin) kbQuery.status = 'active';

  results.knowledgeBase = await KnowledgeBase.find(kbQuery)
    .select('title slug description category tags status views')
    .sort({ views: -1, createdAt: -1 })
    .limit(10);

  // 4. Search Guides
  const guideQuery = {
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { content: searchRegex },
      { category: searchRegex }
    ]
  };

  if (!isAdmin) guideQuery.status = 'active';

  results.guides = await Guide.find(guideQuery)
    .select('title slug description category status')
    .sort({ createdAt: -1 })
    .limit(10);

  return results;
};
