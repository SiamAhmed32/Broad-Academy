import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { SessionCalendar } from "./SessionCalendar";
import type { CounsellingBookingSummary } from "@/lib/student/types";

const mockBookings: CounsellingBookingSummary[] = [
  {
    id: "booking-1",
    fullName: "John Doe",
    schoolName: "Dhaka College",
    classRoll: "101",
    studentGroup: "Science",
    educationLevel: "HSC",
    subjectInterest: "Physics",
    preferredDate: "2026-10-30",
    preferredTime: "10:00 AM",
    scheduledAt: "2026-10-30T10:00:00Z",
    archived: false,
    message: "Need study plan help",
    status: "CONFIRMED",
    meetingLink: "https://meet.google.com/abc-defg-hij",
    counsellorNotes: null,
    sessionFee: 500,
    feeQuotedAt: "2026-10-25T10:00:00Z",
    paymentStatus: "PAID",
    bkashSenderNumber: "01700000000",
    bkashTransactionId: "TX123456",
    paymentSubmittedAt: "2026-10-25T11:00:00Z",
    paidAt: "2026-10-25T12:00:00Z",
    hasPaymentProof: true,
    createdAt: "2026-10-24T10:00:00Z",
    files: [],
  },
  {
    id: "booking-2",
    fullName: "Jane Smith",
    schoolName: "Viqarunnisa",
    classRoll: "202",
    studentGroup: "Science",
    educationLevel: "SSC",
    subjectInterest: "Chemistry",
    preferredDate: "2026-10-31",
    preferredTime: "02:00 PM",
    scheduledAt: null,
    archived: false,
    message: "Exam strategy advice",
    status: "PENDING",
    meetingLink: null,
    counsellorNotes: null,
    sessionFee: null,
    feeQuotedAt: null,
    paymentStatus: "UNQUOTED",
    bkashSenderNumber: null,
    bkashTransactionId: null,
    paymentSubmittedAt: null,
    paidAt: null,
    hasPaymentProof: false,
    createdAt: "2026-10-25T10:00:00Z",
    files: [],
  },
];

test("sidebar toggle button is present immediately adjacent to Today button in open state", () => {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(SessionCalendar, {
      month: "2026-10",
      bookings: [],
      onMonthChange: () => {},
      onSelect: () => {},
    }),
  );

  // 1. Check toggle button presence and accessibility attributes in open state
  assert.ok(
    html.includes('aria-label="Collapse sidebar"'),
    "Toggle button should have aria-label='Collapse sidebar' when open",
  );
  assert.ok(
    html.includes('title="Collapse sidebar"'),
    "Toggle button should have title='Collapse sidebar' when open",
  );
  assert.ok(
    html.includes('aria-expanded="true"'),
    "Toggle button should indicate aria-expanded='true' when open",
  );
  assert.ok(
    html.includes('data-state="open"'),
    "Toggle button should have data-state='open' when open",
  );
  assert.ok(
    html.includes('aria-controls="counselling-calendar-sidebar"'),
    "Toggle button should have aria-controls pointing to the sidebar element id",
  );

  // 2. Check BuilderOS styling classes
  assert.ok(
    html.includes("h-8 w-8"),
    "Toggle button should have h-8 w-8 sizing",
  );
  assert.ok(
    html.includes("border-slate-200"),
    "Toggle button should have slate-200 border matching Today button",
  );

  // 3. Check icon is PanelLeftClose when open
  assert.ok(
    html.includes("lucide-panel-left-close"),
    "Toggle button should render PanelLeftClose icon when open",
  );

  // 4. Verify toggle button is immediately adjacent to Today button in the header bar
  const toggleIndex = html.indexOf('aria-label="Collapse sidebar"');
  const toggleEndIndex =
    html.indexOf("</button>", toggleIndex) + "</button>".length;
  const todayIndex = html.indexOf("Today</button>");
  assert.ok(
    toggleIndex !== -1 && todayIndex !== -1,
    "Both Toggle button and Today button must exist in the HTML",
  );
  assert.ok(
    toggleEndIndex < todayIndex,
    "Toggle button should precede the Today button on the sidebar edge",
  );
  const substringBetween = html.slice(toggleEndIndex, todayIndex);
  assert.equal(
    (substringBetween.match(/<button/g) || []).length,
    1,
    "Today button is the only button immediately following the toggle button",
  );

  // 5. Verify left sidebar is open with id and flex layout and not hidden
  assert.ok(
    html.includes('id="counselling-calendar-sidebar"'),
    "Sidebar should have id='counselling-calendar-sidebar' for ARIA linkage",
  );
  assert.ok(
    html.includes("lg:w-64") && html.includes("xl:w-72"),
    "Sidebar should render with its desktop responsive widths",
  );
  const asideStart = html.indexOf("<aside");
  assert.ok(asideStart !== -1, "aside element should exist");
  const asideEnd = html.indexOf(">", asideStart);
  const asideTag = html.slice(asideStart, asideEnd + 1);
  assert.ok(asideTag.includes("flex"), "aside should have flex display class");
  assert.ok(
    !asideTag.includes("hidden"),
    "aside should not have hidden class initially",
  );
});

test("sidebar toggle button reflects collapsed state with expand icon and hidden aside", () => {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(SessionCalendar, {
      month: "2026-10",
      bookings: [],
      onMonthChange: () => {},
      onSelect: () => {},
      defaultSidebarOpen: false,
    }),
  );

  // 1. Check toggle button accessibility attributes in collapsed state
  assert.ok(
    html.includes('aria-label="Expand sidebar"'),
    "Toggle button should have aria-label='Expand sidebar' when collapsed",
  );
  assert.ok(
    html.includes('title="Expand sidebar"'),
    "Toggle button should have title='Expand sidebar' when collapsed",
  );
  assert.ok(
    html.includes('aria-expanded="false"'),
    "Toggle button should indicate aria-expanded='false' when collapsed",
  );
  assert.ok(
    html.includes('data-state="closed"'),
    "Toggle button should have data-state='closed' when collapsed",
  );
  assert.ok(
    html.includes('aria-controls="counselling-calendar-sidebar"'),
    "Toggle button should still have aria-controls when collapsed",
  );

  // 2. Check icon is PanelLeftOpen when collapsed
  assert.ok(
    html.includes("lucide-panel-left-open"),
    "Toggle button should render PanelLeftOpen icon when collapsed",
  );

  // 3. Verify aside has 'hidden' class to collapse completely and allow main calendar full width
  const asideStart = html.indexOf("<aside");
  assert.ok(asideStart !== -1, "aside element should exist");
  const asideEnd = html.indexOf(">", asideStart);
  const asideTag = html.slice(asideStart, asideEnd + 1);
  assert.ok(
    asideTag.includes("hidden"),
    "aside should have hidden class when collapsed",
  );

  // 4. Main calendar area still has flex-1 to expand across container
  assert.ok(
    html.includes("flex min-w-0 flex-1 flex-col"),
    "Main calendar area must retain flex-1 to expand to full container width",
  );

  // 5. Toggle button is still rendered and visible
  const toggleIndex = html.indexOf('aria-label="Expand sidebar"');
  assert.ok(toggleIndex !== -1, "Toggle button must remain rendered and visible");
});

test("calendar main view area has flex-1 to expand to full container width when sidebar collapses", () => {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(SessionCalendar, {
      month: "2026-10",
      bookings: mockBookings,
      onMonthChange: () => {},
      onSelect: () => {},
    }),
  );

  // Verify the main calendar view container has flex-1 to expand full width
  assert.ok(
    html.includes("flex min-w-0 flex-1 flex-col"),
    "Main calendar area must have flex-1 and min-w-0 to fill available width",
  );

  // Check that booking data renders inside the calendar
  assert.ok(
    html.includes("John Doe"),
    "Confirmed booking event pill should be rendered",
  );

  // Check event filters in sidebar
  assert.ok(
    html.includes("Confirmed") &&
      html.includes("Pending") &&
      html.includes("Completed") &&
      html.includes("Cancelled"),
    "Status filter items should all be present in sidebar",
  );
});

test("month navigation preserves sidebar collapse and filter state by avoiding key={month}", () => {
  const tabContent = fs.readFileSync(
    "src/components/Dashboard/CounsellingTab.tsx",
    "utf8",
  );
  assert.ok(
    !tabContent.includes("<SessionCalendar\n            key={month}") &&
      !tabContent.includes("<SessionCalendar key={month}"),
    "CounsellingTab must not key SessionCalendar by month so navigating months preserves sidebar state",
  );
});

test("bottom whitespace below calendar on counselling dashboard tab is tightened without pb-6", () => {
  const tabContent = fs.readFileSync(
    "src/components/Dashboard/CounsellingTab.tsx",
    "utf8",
  );
  assert.ok(
    !tabContent.includes('className="w-full min-w-0 space-y-5 pb-6"'),
    "CounsellingTab should not contain the excess pb-6 bottom padding class",
  );
  assert.ok(
    tabContent.includes('className="w-full min-w-0 space-y-5"'),
    "CounsellingTab should use clean space-y-5 wrapper without trailing pb-6",
  );

  const portalContent = fs.readFileSync(
    "src/components/Dashboard/StudentPortal.tsx",
    "utf8",
  );
  assert.ok(
    portalContent.includes(
      'activeTab === "counselling" ? "pb-3 sm:pb-4" : "pb-5 sm:pb-7"',
    ),
    "StudentPortal tightens bottom padding specifically for counselling tab",
  );
});

test("aside element has matching data-state and hidden attributes for accessible collapse state", () => {
  const openHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(SessionCalendar, {
      month: "2026-10",
      bookings: [],
      onMonthChange: () => {},
      onSelect: () => {},
      defaultSidebarOpen: true,
    }),
  );
  assert.ok(
    openHtml.includes('id="counselling-calendar-sidebar"'),
    "Open sidebar must have id matching aria-controls",
  );
  assert.ok(
    openHtml.includes('data-state="open"'),
    "Open sidebar aside must have data-state='open'",
  );

  const closedHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(SessionCalendar, {
      month: "2026-10",
      bookings: [],
      onMonthChange: () => {},
      onSelect: () => {},
      defaultSidebarOpen: false,
    }),
  );
  assert.ok(
    closedHtml.includes('data-state="closed"'),
    "Closed sidebar aside must have data-state='closed'",
  );
  assert.ok(
    closedHtml.includes("hidden"),
    "Closed sidebar aside must have hidden attribute/class",
  );
});

test("header toolbar has flex-wrap on navigation cluster and focus rings on all buttons", () => {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(SessionCalendar, {
      month: "2026-10",
      bookings: [],
      onMonthChange: () => {},
      onSelect: () => {},
    }),
  );

  // Check flex-wrap on header navigation cluster to ensure narrow viewport resilience
  assert.ok(
    html.includes("flex flex-wrap items-center gap-2"),
    "Header navigation cluster must have flex-wrap to prevent horizontal overflow on mobile screens",
  );

  // Check focus-visible outline on Today button
  assert.ok(
    html.includes("Today</button>"),
    "Today button must exist",
  );
  assert.ok(
    html.includes("focus-visible:outline-blue-500"),
    "Toolbar buttons must have focus-visible styles",
  );
});

test("handles empty bookings and missing scheduledAt edge cases gracefully without throwing", () => {
  const edgeCaseBookings: CounsellingBookingSummary[] = [
    {
      ...mockBookings[0],
      id: "booking-empty-date",
      scheduledAt: null,
      status: "PENDING",
    },
    {
      ...mockBookings[0],
      id: "booking-invalid-date",
      scheduledAt: "2026-10-15T00:00:00Z",
      status: "COMPLETED",
    },
  ];

  assert.doesNotThrow(() => {
    ReactDOMServer.renderToStaticMarkup(
      React.createElement(SessionCalendar, {
        month: "2026-10",
        bookings: edgeCaseBookings,
        onMonthChange: () => {},
        onSelect: () => {},
      }),
    );
  }, "SessionCalendar should render edge case bookings without throwing");
});

test("mini calendar datepicker uses roving tabIndex and accessible date labels", () => {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(SessionCalendar, {
      month: "2026-10",
      bookings: mockBookings,
      onMonthChange: () => {},
      onSelect: () => {},
    }),
  );

  // 1. Check that the focused day has tabIndex="0" while other days have tabIndex="-1"
  assert.ok(
    html.includes('tabindex="0"'),
    "Mini calendar must render the focused date with tabIndex='0'",
  );
  assert.ok(
    html.includes('tabindex="-1"'),
    "Mini calendar non-focused dates must have tabIndex='-1' for keyboard roving tabindex",
  );

  // 2. Check that mini calendar dates have descriptive aria-labels
  assert.ok(
    html.includes('aria-label="October'),
    "Mini calendar dates must contain full accessible date labels for screen readers",
  );

  // 3. Check role="grid" on mini calendar container
  assert.ok(
    html.includes('role="grid"'),
    "Mini calendar day container must have role='grid'",
  );
});

test("controlled sidebar mode reflects passed sidebarOpen prop and fires onSidebarOpenChange", () => {
  let toggledState: boolean | null = null;
  const closedHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(SessionCalendar, {
      month: "2026-10",
      bookings: [],
      onMonthChange: () => {},
      onSelect: () => {},
      sidebarOpen: false,
      onSidebarOpenChange: (open: boolean) => {
        toggledState = open;
      },
    }),
  );

  assert.ok(
    closedHtml.includes('aria-label="Expand sidebar"'),
    "Controlled sidebarOpen=false must render collapsed toggle",
  );
  assert.ok(
    closedHtml.includes('data-state="closed"'),
    "Controlled sidebarOpen=false must have data-state='closed'",
  );
  assert.equal(
    toggledState,
    null,
    "onSidebarOpenChange is not called before user interaction",
  );
});

interface CalendarControlProps {
  id?: string;
  className?: string;
  hidden?: boolean;
  "aria-controls"?: string;
  "aria-expanded"?: boolean;
  "aria-label"?: string;
  "data-state"?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

type VirtualNode = React.ReactElement<CalendarControlProps> | React.ReactNode;

function findElement(
  node: VirtualNode,
  predicate: (n: React.ReactElement<CalendarControlProps>) => boolean,
): React.ReactElement<CalendarControlProps> | null {
  if (!node) return null;
  if (React.isValidElement<CalendarControlProps>(node)) {
    if (predicate(node)) return node;
    if (node.props?.children) {
      const childRes = findElement(node.props.children, predicate);
      if (childRes) return childRes;
    }
  } else if (Array.isArray(node)) {
    for (const child of node) {
      const res = findElement(child, predicate);
      if (res) return res;
    }
  }
  return null;
}

test("interactive click handler execution toggles sidebar and notifies onSidebarOpenChange", () => {
  const internals = (
    React as unknown as {
      __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: {
        H: unknown;
      };
    }
  ).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const prevH = internals?.H;

  const hookStates: unknown[] = [];
  let hookIndex = 0;

  internals.H = {
    useState: <T>(
      initial: T | (() => T),
    ): [T, (action: T | ((prev: T) => T)) => void] => {
      const idx = hookIndex++;
      if (!(idx in hookStates)) {
        hookStates[idx] =
          typeof initial === "function" ? (initial as () => T)() : initial;
      }
      const setState = (action: T | ((prev: T) => T)) => {
        hookStates[idx] =
          typeof action === "function"
            ? (action as (prev: T) => T)(hookStates[idx] as T)
            : action;
      };
      return [hookStates[idx] as T, setState];
    },
    useRef: <T>(init: T) => ({ current: init }),
    useEffect: () => {},
    useCallback: <T>(fn: T) => fn,
    useMemo: <T>(fn: () => T) => fn(),
  };

  const renderComponent = SessionCalendar as unknown as (
    props: React.ComponentProps<typeof SessionCalendar>,
  ) => React.ReactElement;

  try {
    const notifications: boolean[] = [];

    // 1. Initial render (uncontrolled, default open)
    hookIndex = 0;
    const vdom1 = renderComponent({
      month: "2026-10",
      bookings: [],
      onMonthChange: () => {},
      onSelect: () => {},
      onSidebarOpenChange: (open: boolean) => notifications.push(open),
    });

    const toggleBtn1 = findElement(
      vdom1,
      (n) => n?.props?.["aria-controls"] === "counselling-calendar-sidebar",
    );
    const aside1 = findElement(
      vdom1,
      (n) => n?.props?.id === "counselling-calendar-sidebar",
    );

    assert.equal(
      toggleBtn1?.props?.["data-state"],
      "open",
      "Initially toggle button has data-state='open'",
    );
    assert.equal(
      toggleBtn1?.props?.["aria-expanded"],
      true,
      "Initially toggle button has aria-expanded=true",
    );
    assert.equal(
      aside1?.props?.hidden,
      false,
      "Initially aside is not hidden",
    );

    // 2. Click the toggle button to collapse!
    toggleBtn1?.props.onClick?.();
    assert.deepEqual(
      notifications,
      [false],
      "onSidebarOpenChange should be notified with false",
    );

    hookIndex = 0;
    const vdom2 = renderComponent({
      month: "2026-10",
      bookings: [],
      onMonthChange: () => {},
      onSelect: () => {},
      onSidebarOpenChange: (open: boolean) => notifications.push(open),
    });

    const toggleBtn2 = findElement(
      vdom2,
      (n) => n?.props?.["aria-controls"] === "counselling-calendar-sidebar",
    );
    const aside2 = findElement(
      vdom2,
      (n) => n?.props?.id === "counselling-calendar-sidebar",
    );

    assert.equal(
      toggleBtn2?.props?.["data-state"],
      "closed",
      "After 1st click, toggle button has data-state='closed'",
    );
    assert.equal(
      toggleBtn2?.props?.["aria-expanded"],
      false,
      "After 1st click, toggle button has aria-expanded=false",
    );
    assert.equal(
      toggleBtn2?.props?.["aria-label"],
      "Expand sidebar",
      "After 1st click, toggle button has aria-label='Expand sidebar'",
    );
    assert.equal(
      aside2?.props?.hidden,
      true,
      "After 1st click, aside is hidden=true",
    );
    assert.ok(
      aside2?.props?.className?.includes("hidden"),
      "After 1st click, aside className includes 'hidden'",
    );

    // 3. Click the toggle button again to restore/expand!
    toggleBtn2?.props.onClick?.();
    assert.deepEqual(
      notifications,
      [false, true],
      "onSidebarOpenChange should be notified with true on re-expansion",
    );

    hookIndex = 0;
    const vdom3 = renderComponent({
      month: "2026-10",
      bookings: [],
      onMonthChange: () => {},
      onSelect: () => {},
      onSidebarOpenChange: (open: boolean) => notifications.push(open),
    });

    const toggleBtn3 = findElement(
      vdom3,
      (n) => n?.props?.["aria-controls"] === "counselling-calendar-sidebar",
    );
    const aside3 = findElement(
      vdom3,
      (n) => n?.props?.id === "counselling-calendar-sidebar",
    );

    assert.equal(
      toggleBtn3?.props?.["data-state"],
      "open",
      "After 2nd click, toggle button restores to data-state='open'",
    );
    assert.equal(
      toggleBtn3?.props?.["aria-expanded"],
      true,
      "After 2nd click, toggle button restores to aria-expanded=true",
    );
    assert.equal(
      toggleBtn3?.props?.["aria-label"],
      "Collapse sidebar",
      "After 2nd click, toggle button restores to aria-label='Collapse sidebar'",
    );
    assert.equal(
      aside3?.props?.hidden,
      false,
      "After 2nd click, aside restores to hidden=false",
    );
  } finally {
    internals.H = prevH;
  }
});

