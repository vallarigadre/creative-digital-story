---
title: "How I set up a blog that writes itself (and why I still edit every post)"
subtitle: "The exact system behind my twice-weekly home and lifestyle blog, from the scheduled AI task to the moment a post goes live."
date: 2026-10-10
order: 3
slug: blog-that-writes-itself
category: Behind the Build
description: "How I automated a twice-weekly affiliate blog with a scheduled AI task: trend research, product picks, image prompts, and the human checks I never skip."
tags: [ai blogging, automated blog, blog automation, ai side hustle, affiliate blog, claude]
tools: [Claude, ChatGPT, Netlify, GitHub, Amazon SiteStripe]
pin_title: "How I Built a Blog That Writes Itself With AI"
pin_description: "The real system behind my automated affiliate blog: a scheduled AI task that researches, writes and picks products twice a week, plus the human checks that keep it good."
cover: "/images/blog-that-writes-itself.jpg"
cover_shape: tall
cover_alt: "A laptop on a cream desk showing a blog draft, with a coffee cup and a notebook of handwritten checklists"
product:
  name: "Make Money with an Automated Affiliate Blog"
  blurb: "My step-by-step course on building this exact system: the website, the master brief, the scheduled task, images, SEO and Pinterest, with a hands-on exercise in every chapter."
  cta: "See the course"
  url: "https://shop.beacons.ai/creativedigitalstory/3892a1a5-5973-4e66-8ba2-0ae2f20b015c"
---
Twice a week, at 8:53 in the morning, a blog post arrives in my chat. It has already picked a trending topic, read the sources, written about 1,500 words, chosen ten or so products, and written the prompts for every photo in the story. I didn't write it. But I do read every word before anyone else does.

That's the honest shape of an "automated blog." It is not a money printer you switch on and forget. It's closer to having a very fast, very thorough junior writer who works on a schedule and hands you a first draft you can actually use.

This entry walks through exactly how my home and lifestyle blog, House & Habit, runs: what the AI does, what I do, and the mistakes I made setting it up.

## The idea: one job, done on a schedule

House & Habit is a magazine-style blog about home decor, cozy living and hosting, aimed at American women who love that world. It earns through Amazon affiliate links: when a reader buys a lamp or a linen napkin set I recommend, I earn a small commission.

Affiliate blogs live or die on consistency. Google and Pinterest both reward sites that publish regularly, and that is the exact thing a busy mom struggles to do. So instead of trying to find writing time, I gave the writing a calendar of its own.

The core of the system is a **scheduled task in Claude**. It's a set of instructions that runs by itself every Tuesday and Friday morning, starts a fresh session, does the whole job from scratch and sends me the results.

![A close-up of a phone screen showing a scheduled task notification next to a cup of tea](/images/blog-that-writes-itself-2.jpg)

## What the AI does on its own

The instructions read like a brief you would hand a freelance writer. They're long, specific and a little bossy, and that is on purpose. Here is what happens in each run.

**1. It picks a fresh, timely topic.** It checks the date, searches for what's trending in home decor and entertaining right now, and ties the topic to the season or an upcoming holiday. It also has a list of topics already on the site, so it never writes the same story twice.

**2. It writes the post.** About 1,200 to 1,800 words, in a warm, glossy-magazine voice, with a clickable title, two backup titles, a subtitle and a search-friendly description. It paraphrases what it learned rather than copying any article.

**3. It finds real products.** This is the step I'm strictest about. The task searches Amazon directly and only uses products it actually found there, with their real product codes. It's told plainly never to invent a product, a price or a rating.

**4. It writes the photo prompts.** Every post gets a prompt for the cover and three or four in-story photos, with a mix of shots (a wide room, a close-up detail, a flat lay) and different lighting, so the site doesn't look samey.

**5. It delivers two files.** One is ready to paste into Medium, with my editor notes on top. The other is formatted for my own website, with only the public content.

## What I still do by hand

This is the part most "automate your blog" videos skip. My job each Tuesday and Friday takes a fraction of the time writing would, but it is real work:

- **I read the whole post.** I fix anything that sounds off, cut anything vague and make sure it's actually useful.
- **I check the products.** I open each one, make sure it fits the story and still looks good, and swap in my own tracked affiliate links from Amazon's SiteStripe toolbar.
- **I make the photos.** I paste each prompt into ChatGPT and save the images with the exact file names the post expects.
- **I publish.** The post and photos go into the site's folder on GitHub, and Netlify rebuilds the site automatically.

To make the link swap painless, I had Claude build me a small checklist page that lists every product in a post with a box to paste my own link. It sounds like a tiny thing, but it turned the most tedious step into a few minutes of copy and paste.

![An overhead flat lay of a notebook with a handwritten publishing checklist, a pen and sticky notes](/images/blog-that-writes-itself-3.jpg)

## Three mistakes I made (so you don't have to)

**My first posts were filler.** The first batch of AI posts on the site were short, generic and had no real products or research behind them. They read like what they were: words to fill a page. I scrapped them and rewrote the brief to demand length, real sources, real products and specific advice. Lesson: the quality of an automated blog is set by the quality of its instructions. Vague brief, vague posts.

**I nearly launched under a name I couldn't own.** The site started life as "The Gathered Home." Before committing, I checked trademarks and domains for a few alternatives, and some of the names I liked already belonged to other businesses in one way or another. I settled on House & Habit and it runs on a free Netlify address for now. Do this check before you design a single page.

**I tried to save time on images and lost it.** My first attempt at generating photos inside a design tool gave me images too small and soft to use on a blog. Switching to ChatGPT for images, with the size written into every prompt, solved it.

## The stack, in plain words

| Job | Tool |
|---|---|
| Research, writing, product search, photo prompts | Claude, on a scheduled task |
| Photos | ChatGPT image generation |
| Affiliate links | Amazon SiteStripe |
| Storing the site's files | GitHub |
| Hosting the website | Netlify (free plan) |
| Second home for posts | Medium |

The website itself is a simple one, and Claude built it too. Each post is a plain text file, and a small build script turns those files into the finished site. When I add a new post file, Netlify notices and publishes the update.

## Could you do this without code?

Yes. I'm not a developer, and you don't need to be one. The real skill here is thinking in simple systems and checklists. You need to be able to describe a job clearly, notice when the output is off, and tighten the instructions until it isn't.

If you want to try it, start smaller than I did:

1. **Pick one blog and one schedule.** Once a week is plenty.
2. **Write the brief like you're hiring someone.** Audience, voice, length, structure, what to avoid.
3. **Run it by hand three times first.** Read the results critically and fix the brief after each one.
4. **Only then put it on a schedule.**
5. **Keep a human step before publishing.** Always.

## Why I still edit every post

Because my name is on it. An automated blog that publishes unchecked content is how you end up recommending a product that no longer exists, or confidently stating something that isn't true. The AI does the research and the first draft brilliantly. The judgment is still mine.

And honestly, that's the version of AI income I believe in: not replacing yourself, but taking the hours you spent on the blank page and spending them on the decisions that matter.

This blog runs on the same system, by the way. If you want to see how I build the digital products I sell, from a blank chat to a finished guide, [entry No. 02 walks through it](/digital-products-with-ai).
