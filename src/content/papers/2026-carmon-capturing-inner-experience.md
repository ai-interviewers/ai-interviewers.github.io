---
title: "Capturing Inner Experience At Scale: An AI Interviewer Co-Developed with the Founder of a Landmark Phenomenological Method"
authors: ["Jona Carmon", "Clara Bersch", "Charles Fernyhough", "Russell T. Hurlburt", "Simone Kühn"]
date: 2026-07-22
url: "https://arxiv.org/abs/2607.20310"
arxiv: "2607.20310"
venue:
venueType: preprint

# Classification below is MODEL-ASSIGNED and UNCONFIRMED — read the paper and verify,
# then remove the verified field names from needsReview. See `npm run review`.
# NOTE: Modality inferred; the paper describes beeps plus interviews without naming text vs voice.
autonomy: autonomous
modality: text
paperType: ["new-system"]
domains: ["psychology"]

code_url:
dataset_url:
thumbnail: "/thumbnails/2026-carmon-capturing-inner-experience.webp"
bibtex:

needsReview: ["autonomy", "modality", "paperType", "domains", "venue"]
abstractIsSummary: false
draft: false
---

Subjective experience is central to psychological science, yet methods for studying it force a choice between depth and scale. Classical Experience sampling, as in ecological momentary assessments (EMA), captures experience as it occurs, but it confines participants to predetermined response formats that prescribe how experience is measured. Descriptive Experience Sampling (DES) instead investigates specific moments in depth through expert expositional interviews, but its reliance on scarce trained interviewers keeps samples small. Large language model (LLM) systems can scale qualitative interviewing. Some models operationalize established interviewing methods such as motivational interviewing, yet none is grounded in a method for apprehending inner experience. Here we present an AI interviewer that aspires to operationalize DES into an explicit, inspectable reasoning architecture. At each turn it appraises the participant's message across eleven quality dimensions, maintains a conservative account of what has been established, selects a stage-appropriate intervention, and composes a single non-leading query, always holding that temporal grounding precedes experiential content. It was derived from the full corpus of DES transcripts and refined with the method's originator Russell T. Hurlburt. To our knowledge it is the first AI interviewer grounded in an established method for studying inner experience. The interviewer runs inside Introscope, an application that delivers the beeps and conducts the interviews and a study platform that lets researchers run studies via shareable links and review the sampled experience. It is demonstrated in an accompanying video https://introscope.mpib-berlin.mpg.de/video. Pending validation studies, we will make it freely available to researchers and the public, for crowdsourced sampling and individual exploration of inner experience.
