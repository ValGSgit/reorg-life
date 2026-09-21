Fixed the demo seeder writing life areas that do not
exist. It used `social`, `home`, `life` and `growth`, none of which are in
DOMAINS, so seeded entries rendered without a colour or label and could not be
reached by the timeline filters added in T-022 — demo data quietly making a
working feature look broken. The seed now spreads across all six real areas so
every filter chip has something behind it, and a test refuses any life area
that is not in DOMAINS. Found by the agent working T-022.
