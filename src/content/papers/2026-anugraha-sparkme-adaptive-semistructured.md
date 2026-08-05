---
title: "SparkMe: Adaptive Semi-Structured Interviewing for Qualitative Insight Discovery"
authors: ["David Anugraha", "Vishakh Padmakumar", "Diyi Yang"]
date: 2026-02-24
url: "https://arxiv.org/abs/2602.21136"
arxiv: "2602.21136"
venue:
venueType: preprint

# Classification below is MODEL-ASSIGNED and UNCONFIRMED — read the paper and verify,
# then remove the verified field names from needsReview. See `npm run review`.
autonomy: autonomous
modality: text
paperType: ["new-system"]
domains: ["ux research", "qualitative research"]

code_url:
dataset_url:
thumbnail: "/thumbnails/2026-anugraha-sparkme-adaptive-semistructured.webp"
bibtex:

needsReview: ["autonomy", "modality", "paperType", "domains", "venue"]
abstractIsSummary: false
draft: false
---

Qualitative insights from user experiences are critical for informing product and policy decisions, but collecting such data at scale is constrained by the time and availability of experts to conduct semi-structured interviews. Recent work has explored using large language models (LLMs) to automate interviewing, yet existing systems lack a principled mechanism for balancing systematic coverage of predefined topics with adaptive exploration, or the ability to pursue follow-ups, deep dives, and emergent themes that arise organically during conversation. In this work, we formulate adaptive semi-structured interviewing as an optimization problem over the interviewer's behavior. We define interview utility as a trade-off between coverage of a predefined interview topic guide, discovery of relevant emergent themes, and interview cost measured by length. Based on this formulation, we introduce SparkMe, a multi-agent LLM interviewer that performs deliberative planning via simulated conversation rollouts to select questions with high expected utility. We evaluate SparkMe through controlled experiments with LLM-based interviewees, showing that it achieves higher interview utility, improving topic guide coverage (+4.7% over the best baseline) and eliciting richer emergent insights while using fewer conversational turns than prior LLM interviewing approaches. We further validate SparkMe in a user study with 70 participants across 7 professions on the impact of AI on their workflows. Domain experts rate SparkMe as producing high-quality adaptive interviews that surface helpful profession-specific insights not captured by prior approaches. The code, datasets, and evaluation protocols for SparkMe are available as open-source at https://github.com/SALT-NLP/SparkMe.
