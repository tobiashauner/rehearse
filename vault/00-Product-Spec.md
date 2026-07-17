---
status: source-of-truth
last-verified: 2026-07-03
---

# Interview Workspace — Product Specification (v1 MVP)

> This is the original spec as given at project kickoff, reproduced verbatim. Do not edit
> the content below to reflect implementation reality — track drift/progress in
> [[Roadmap]] and [[Changelog]] instead, and only touch this file if the *product intent*
> itself changes.

## Overview

Interview Workspace is a web application that helps users prepare for job interviews through AI-generated mock interviews.

Unlike traditional interview apps that simply ask a fixed list of questions, Interview Workspace creates an evolving interview based on uploaded documents, company research, interviewer context, previous answers, and ongoing coaching.

The application is built with React and Next.js and uses conversational AI, speech synthesis, speech transcription, and structured feedback to simulate a realistic interview experience.

---

## Technology Stack

### Frontend

- Next.js (App Router)
- React
- TypeScript
- TailwindCSS
- shadcn/ui
- React Hook Form
- TanStack Query
- Framer Motion
- Zustand (lightweight client state)

### Backend

Supabase

Use Supabase for:

- Authentication
- PostgreSQL
- Storage
- Edge Functions
- Row Level Security

No custom backend required for MVP.

---

## AI Services

OpenAI

Use for:

- Interview generation
- Resume analysis
- Job description analysis
- Company analysis
- Transcript evaluation
- Follow-up question generation
- Summary generation
- Speech-to-text
- Text-to-speech

---

## Product Philosophy

The product revolves around Projects.

Every interview belongs to a Project.

Example

Senior Product Designer @ Stripe

Inside the project:

- Resume
- Job description
- Company notes
- Interviewer profiles
- AI briefing
- Multiple interview sessions
- Feedback history
- Progress over time

---

## Core Objects

### Project

Fields

id

title

company

role

status

createdAt

updatedAt

---

### Resources

Multiple resources can belong to a project.

Supported types

Resume

Cover Letter

Portfolio PDF

Job Description

LinkedIn URL

Company Website

Hiring Manager LinkedIn

Personal Notes

Other PDFs

---

### Interview Session

Each project contains many interview sessions.

Session contains

configuration

question list

audio recordings

transcripts

feedback

scores

duration

---

### Question

Fields

question

category

difficulty

askedAt

ttsAudio

---

### Answer

Fields

audioFile

transcript

duration

feedback

score

followUpGenerated

---

## Navigation

Dashboard

Projects

Project Details

Interview

Review Session

Analytics

Settings

---

## Dashboard

Shows

Recent Projects

Continue Interview

Practice Today

Recent Scores

Improvement Trends

---

## Project Screen

Header

Company

Role

Interview Readiness Score

Tabs

Overview

Resources

Interview Sessions

AI Briefing

Analytics

Settings

---

## Resources Tab

Upload

Resume

PDF

DOCX

TXT

Paste

Job Description

Notes

URLs

Automatically extract content from

Company website

LinkedIn profile

Career page

All extracted content becomes searchable context.

---

## AI Briefing

Generated automatically.

Sections

Role Summary

Required Skills

Leadership Signals

Company Culture

Likely Interview Focus

Resume Strengths

Resume Gaps

Potential Concerns

Suggested Stories

Recommended STAR Examples

Likely Questions

---

## Configure Interview

User chooses

Interview length

15

30

45

60 minutes

Interview type

Behavioral

Technical

Product

Leadership

Panel

Recruiter Screen

Hiring Manager

Executive

Difficulty

Easy

Medium

Hard

Interviewer personality

Friendly

Direct

Analytical

Skeptical

Fast-paced

Interrupts often

Pushes for metrics

Challenges assumptions

Conversation mode

Adaptive

Fixed questions

---

## Interview Experience

The interview page is the heart of the application.

Layout

Left panel

Current question

Timer

Recording controls

Audio visualization

Progress

Right panel

Live transcript

Current feedback (optional)

Session notes

Upcoming topics

Bottom

Playback controls

---

## Interview Flow

Click Start Interview

AI generates opening statement

AI converts question to speech

Browser plays audio

User clicks Start Answer

Microphone recording begins

User clicks Finish

Audio uploads automatically

Speech transcription begins

Transcript appears

AI evaluates answer

Feedback stored

AI generates follow-up if appropriate

Next question begins

Repeat

---

## Adaptive Interview Logic

AI remembers

Previous answers

Weak areas

Strong examples

Avoids duplicate questions

Asks natural follow-ups

Example

Question

Tell me about a difficult stakeholder.

User

Mentions engineering conflict.

AI

What specifically caused the disagreement?

User

Answers.

AI

If you could do it again, what would you change?

Feels like a real interviewer.

---

## Answer Feedback

Each answer receives structured evaluation.

Overall Score

Communication

Confidence

Structure

STAR Completeness

Specificity

Business Impact

Leadership

Conciseness

Question Alignment

Evidence

Metrics Used

Filler Words

Missed Opportunities

Suggested Improved Answer

Top 3 Improvements

---

## Playback

Each answer is stored independently.

User can

Replay

Download

View transcript

View feedback

Re-answer

Compare versions

---

## Session Summary

After completion

Overall Score

Strengths

Weaknesses

Questions Missed

Most Common Feedback

Recommended Practice

Confidence Trend

Suggested Next Interview

---

## Analytics

Charts

Average Score

STAR Trend

Confidence Trend

Leadership Score

Communication Score

Answer Length

Interview Hours

Practice Streak

---

## AI Coaching

Instead of generic advice

AI creates a coaching plan.

Example

Work on concise introductions

Practice quantifying impact

Use stronger metrics

Provide more conflict examples

Reduce filler words

Generate follow-up interview focused only on weaknesses

---

## Storage

Supabase Storage

Store

Audio

PDFs

Generated audio

Exports

Database stores metadata only.

---

## Authentication

Email

Google

GitHub

Magic Link

---

## Settings

Voice

Playback Speed

Auto Advance

Dark Mode

Transcript Font Size

Delete Recordings Automatically

Privacy Settings

---

## Future Features

Realtime voice conversation

Live interruption

Video interviews

Multiple interviewers

Panel interviews

System Design whiteboard

Coding interview mode

Calendar integration

Interview reminders

Company research automation

LinkedIn import

Resume optimization

AI interviewer personas

Share interview with coach

Export coaching report

---

## UI Design Principles

Minimal.

No clutter.

Large typography.

Calm colors.

Lots of whitespace.

Audio-first experience.

Every screen should answer one question:

"What should I do next?"

---

## Folder Structure

/app

/components

/components/interview

/components/project

/components/ui

/lib

/lib/openai

/lib/supabase

/lib/audio

/lib/prompts

/hooks

/services

/types

/utils

/styles

---

## AI Prompt Strategy

Separate prompts into modules.

project-analysis.ts

question-generation.ts

answer-evaluation.ts

follow-up-generation.ts

session-summary.ts

coaching-plan.ts

Never embed prompts inside components.

---

## Success Metrics

A successful MVP allows a user to:

1. Create a project.
2. Upload a resume and job description.
3. Generate a realistic interview.
4. Complete a spoken interview in the browser.
5. Receive detailed AI feedback for every answer.
6. Replay every answer.
7. View transcripts.
8. Run another interview that adapts based on previous performance.

If those eight capabilities work smoothly, the MVP is complete.
