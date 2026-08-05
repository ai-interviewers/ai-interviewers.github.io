---
title: "ISCA: A Framework for Interview-Style Conversational Agents"
authors: ["Charles Welch", "Allison Lahnala", "Vasudha Varadarajan", "Lucie Flek", "Rada Mihalcea", "J. Lomax Boyd", "João Sedoc"]
date: 2025-08-20
url: "https://arxiv.org/abs/2508.14344"
arxiv: "2508.14344"
venue:
venueType: preprint

# Classification below is MODEL-ASSIGNED and UNCONFIRMED — read the paper and verify,
# then remove the verified field names from needsReview. See `npm run review`.
# NOTE: Explicitly non-generative / low-compute, unlike the LLM systems around it.
autonomy: autonomous
modality: text
paperType: ["new-system"]
domains: ["health", "public opinion"]

code_url:
dataset_url:
thumbnail: "/thumbnails/2025-welch-isca-framework-interviewstyle.webp"
bibtex:

needsReview: ["autonomy", "modality", "paperType", "domains", "venue"]
abstractIsSummary: false
draft: false
---

We present a low-compute non-generative system for implementing interview-style conversational agents which can be used to facilitate qualitative data collection through controlled interactions and quantitative analysis. Use cases include applications to tracking attitude formation or behavior change, where control or standardization over the conversational flow is desired. We show how our system can be easily adjusted through an online administrative panel to create new interviews, making the tool accessible without coding. Two case studies are presented as example applications, one regarding the Expressive Interviewing system for COVID-19 and the other a semi-structured interview to survey public opinion on emerging neurotechnology. Our code is open-source, allowing others to build off of our work and develop extensions for additional functionality.
