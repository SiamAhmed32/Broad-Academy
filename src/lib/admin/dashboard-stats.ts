import { db } from "@/lib/db";

export async function getAdminDashboardStats() {
  const [
    students,
    activeEnrollments,
    pendingEnrollmentRequests,
    revenueAggregate,
    pendingCounselling,
    newContactMessages,
    pendingDocuments,
    publishedCourses,
    newsletterSubscribers,
  ] = await Promise.all([
    db.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
    db.enrollment.count({ where: { status: "ACTIVE" } }),
    db.enrollmentRequest.count({
      where: { status: { in: ["PENDING", "REVIEWING"] } },
    }),
    db.enrollmentRequest.aggregate({
      where: { status: "APPROVED" },
      _sum: { paidAmount: true },
    }),
    db.counsellingBooking.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.documentSubmission.count({ where: { status: "PENDING" } }),
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    students,
    activeEnrollments,
    pendingEnrollmentRequests,
    totalRevenue: revenueAggregate._sum.paidAmount ?? 0,
    pendingCounselling,
    newContactMessages,
    pendingDocuments,
    publishedCourses,
    newsletterSubscribers,
  };
}
