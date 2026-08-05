---
title: "BED-LLM: Intelligent Information Gathering with LLMs and Bayesian Experimental Design"
authors: ["Deepro Choudhury", "Sinead Williamson", "Adam Goliński", "Ning Miao", "Freddie Bickford Smith", "Michael Kirchhof", "Yizhe Zhang", "Tom Rainforth"]
date: 2025-08-28
url: "https://arxiv.org/abs/2508.21184"
arxiv: "2508.21184"
# arXiv comment/journal-ref, needs a human read:
# Published at the International Conference on Learning Representations 2026
venue:
venueType: preprint

# Classification left blank on purpose — see `npm run review`.
autonomy:
modality:
paperType: []
domains: []

code_url:
dataset_url:
thumbnail: "/thumbnails/2025-choudhury-bedllm-intelligent-information.webp"
bibtex:

needsReview: ["autonomy", "modality", "paperType", "domains", "venue"]
abstractIsSummary: false
draft: false
---

We propose a general-purpose approach for improving the ability of large language models (LLMs) to intelligently and adaptively gather information from a user or other external source using the framework of sequential Bayesian experimental design (BED). This enables LLMs to act as effective multi-turn conversational agents and interactively interface with external environments. Our approach, which we call BED-LLM (Bayesian experimental design with large language models), is based on iteratively choosing questions or queries that maximize the expected information gain (EIG) with respect to a variable of interest given the responses gathered previously. We show how this EIG can be formulated (and then estimated) in a principled way using a probabilistic model derived from the LLM's predictive distributions and provide detailed insights into key decisions in its construction and updating procedure. We find that BED-LLM achieves substantial gains in performance across a wide range of tests based on the 20 Questions game and using the LLM to actively infer user preferences, compared to purely prompting-based design generation and other adaptive design strategies.
