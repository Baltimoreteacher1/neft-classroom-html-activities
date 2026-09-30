# Family homework week access and publication review

The family page keeps the current published week visible when a teacher posts an
upcoming plan. The Homework week menu opens upcoming and previous homework;
previous work carries an explicit date notice and its original due dates.
Class and language links retain a selected week. Changing classes returns to the
current/upcoming plan for that class.

Archives contain only homework from published snapshots for currently visible
classes. They use the latest publication for each class/week and retain up to
52 publication versions, rather than the former five. Already discarded history
cannot be reconstructed. Drafts and the protected teacher history endpoint stay
private. No existing homework data is rewritten by this code deployment.

In the teacher homework editor, each day has separate choices for **Not posted
yet**, **No homework assigned**, and a lesson. A dated week with no homework still
shows all five daily statuses. Existing `no-class` entries retain their previous
no-homework meaning. New unfilled days use `pending`.

Before publishing, all visible classes appear in a publication review. Missing
plans, pending days, and past/future weeks produce warnings. Invalid Mondays,
unavailable or hidden manifest homework, unsupported links, and due dates before
the assignment produce errors. The editor also checks each unique assigned homework
page immediately before publishing and blocks unavailable links. The server independently rejects invalid week
starts and due dates and preserves revision-conflict protection. Changing the
draft invalidates the preview and publication confirmation.

Focused checks:

```sh
node --test curriculum/family-connections/family-app-runtime.test.mjs \
  curriculum/family-connections/family-connections.test.mjs \
  curriculum/family-connections/shared/homework-upgrades.test.mjs \
  functions/api/family-connections/homework-publication.test.mjs
```

The runtime tests use synthetic local data and exercise the actual family app
and inline teacher editor without signing in or changing production assignments.
