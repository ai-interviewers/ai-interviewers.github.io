---
title: "AInterviewer: A Platform for Designing and Conducting AI-led Qualitative Interviews"
authors: ["Tobias Priesholm Gardhus", "Nikolas Vitsakis", "Fie Lejre Frederiksen", "Anna Rogers", "Hjalmar Bang Carlsen"]
date: 2026-05-15
url: "https://arxiv.org/abs/2606.20588"
arxiv: "2606.20588"
venue:
venueType: preprint

# Classification left blank on purpose — see `npm run review`.
autonomy:
modality:
paperType: []
domains: []

code_url:
dataset_url:
thumbnail: "/thumbnails/2026-gardhus-ainterviewer-platform-designing.webp"
bibtex:

needsReview: ["autonomy", "modality", "paperType", "domains", "venue"]
abstractIsSummary: false
draft: false
---

There are now multiple proposals for systems based on Large Language Models (LLMs) to conduct automated qualitative interviews, but most of the current solutions rely on proprietary LLMs, which compromises reproducibility and data security. They also rely on LLMs for all interview tasks, which limits standardisation of question wording as well as control over question order. To address these issues, we introduce the AInterviewer platform, an opensource solution based on a multi-agent pipeline that combines controlled question administration of survey software with the flexibility of LLMs. AInterviewer is an interdisciplinary effort designed to implement best practices of qualitative interviewing in social science, and it can run with locally hosted models to ensure security, transparency, and reproducibility. Our platform provides a web-based GUI supporting each phase of data collection: from interview guide design and pilot testing to interview distribution and data collection monitoring.
