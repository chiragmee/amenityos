# 01 — Product Overview

## Problem

Workplace amenity booking is typically a multi-step UI workflow.

Employees may need to:

1. open the booking application
2. locate a building/floor
3. search for an amenity
4. select date
5. select time
6. select duration
7. enter attendees
8. understand eligibility
9. check price/credits
10. confirm
11. retrieve an access pass

The user often knows the desired outcome from the beginning.

## Solution

Nookly provides a conversational interface where the employee expresses the desired outcome in natural language.

Example:

> Book Emerald Meeting Room today at 3 PM for five people.

The agent turns that request into a controlled sequence of operations.

## Personas

### Employee

Needs to:
- discover amenities
- understand availability
- make bookings
- manage credits
- retrieve access passes
- cancel or inspect bookings

### Amenity administrator

Needs to:
- create/configure amenities
- configure capacity
- configure hours
- configure durations
- set booking limits
- set free/paid status
- assign credit costs
- define eligibility
- maintain guidelines

## Core user journeys

### Free booking

User request
→ amenity identification
→ rule validation
→ availability
→ booking
→ access credential
→ confirmation

### Paid booking

User request
→ availability
→ cost
→ credit balance
→ explicit confirmation
→ atomic credit deduction + booking
→ access credential
→ confirmation

### Unavailable booking

User request
→ availability check
→ unavailable
→ retrieve valid alternatives
→ user selects alternative
→ normal booking flow

### Policy question

User question
→ retrieve relevant amenity policy
→ answer from policy context

### Access validation

QR/token
→ token validation
→ booking lookup
→ time/amenity verification
→ allow/deny

## Primary success metric

**Successful amenity booking completion rate**

This is preferable to measuring conversation volume because the product's value is completed action.

## Product principles

1. Minimize user effort.
2. Preserve deterministic business rules.
3. Never claim success without execution evidence.
4. Ask only necessary clarifying questions.
5. Make important consequences explicit.
6. Prefer safe failure over unsafe action.
7. Keep the agent conversational without making it opaque.

## MVP user experience

The user should feel:

> "I told the workplace assistant what I wanted, and it handled the workflow."

The user should not feel:

> "I am filling out a form through a chatbot."
