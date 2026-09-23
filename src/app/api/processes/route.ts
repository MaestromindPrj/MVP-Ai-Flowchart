import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const department = searchParams.get("department");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { department: { contains: search } },
        { ownerName: { contains: search } },
      ];
    }
    if (status && status !== "All") {
      where.status = status;
    }
    if (department && department !== "All") {
      where.department = department;
    }

    const processes = await prisma.process.findMany({
      where,
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        participants: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ processes });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch processes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, department, ownerName, ownerEmail, templateId } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Process name is required" },
        { status: 400 }
      );
    }

    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Acme Global Enterprises" },
      });
    }

    let initialNodes: any[] = [];
    let initialEdges: any[] = [];
    let initialParticipants: any[] = [];

    const now = Date.now();

    if (templateId === "order-to-cash") {
      initialNodes = [
        {
          id: `node-${now}-1`,
          type: "start",
          label: "Sales Order Submitted",
          role: "Sales Executive",
          description: "Customer executes sales quote via portal or EDI.",
          sla: "Instant",
          position: { x: 250, y: 50 },
        },
        {
          id: `node-${now}-2`,
          type: "decision",
          label: "Discount Threshold Review",
          role: "Sales Operations",
          condition: "Discount > 15%",
          sla: "1 hour",
          description: "Evaluate custom pricing discounts against standard catalog rate.",
          position: { x: 250, y: 180 },
        },
        {
          id: `node-${now}-3`,
          type: "approval",
          label: "Executive Commercial Approval",
          role: "Finance Director",
          sla: "4 hours",
          description: "Sign-off required on enterprise margin discount.",
          position: { x: 250, y: 310 },
        },
        {
          id: `node-${now}-4`,
          type: "task",
          label: "Inventory Allocation & ERP Check",
          role: "Inventory Specialist",
          sla: "2 hours",
          description: "Lock physical stock units in ERP warehouse ledger.",
          position: { x: 250, y: 440 },
        },
        {
          id: `node-${now}-5`,
          type: "task",
          label: "Pick, Pack & Barcode Label",
          role: "Warehouse Lead",
          sla: "4 hours",
          description: "Assemble physical shipment items and attach logistics tracking barcode.",
          position: { x: 250, y: 570 },
        },
        {
          id: `node-${now}-6`,
          type: "approval",
          label: "QA & Hazmat Compliance Verification",
          role: "QA Inspector",
          sla: "1 hour",
          description: "Inspect package integrity and verify hazardous material declaration.",
          position: { x: 250, y: 700 },
        },
        {
          id: `node-${now}-7`,
          type: "task",
          label: "Carrier Hand-off & Dispatch Notice",
          role: "Logistics Coordinator",
          sla: "2 hours",
          description: "Hand parcel to freight forwarder and trigger customer ASN notification.",
          position: { x: 250, y: 830 },
        },
        {
          id: `node-${now}-8`,
          type: "end",
          label: "Delivery Confirmed & Invoiced",
          role: "Accounts Receivable",
          sla: "Same day",
          description: "Electronic proof of delivery received and tax invoice booked.",
          position: { x: 250, y: 960 },
        },
      ];

      for (let i = 0; i < initialNodes.length - 1; i++) {
        initialEdges.push({
          id: `e-${initialNodes[i].id}-${initialNodes[i + 1].id}`,
          source: initialNodes[i].id,
          target: initialNodes[i + 1].id,
        });
      }

      initialParticipants = [
        { name: ownerName || "Alex Morgan", role: "Owner / Lead", email: ownerEmail },
        { name: "Sarah Chen", role: "Sales Operations Manager", email: "sarah.chen@acme.com" },
        { name: "Michael Patel", role: "Finance Director", email: "m.patel@acme.com" },
        { name: "David Rodriguez", role: "Logistics Coordinator", email: "d.rodriguez@acme.com" },
      ];
    } else if (templateId === "employee-onboarding") {
      initialNodes = [
        {
          id: `node-${now}-1`,
          type: "start",
          label: "Offer Letter Executed",
          role: "Hiring Manager",
          description: "Candidate signs offer letter and background consent form.",
          position: { x: 250, y: 50 },
        },
        {
          id: `node-${now}-2`,
          type: "task",
          label: "Background Check & Document Intake",
          role: "HR Coordinator",
          sla: "48 hours",
          description: "Verify identity documents, credentials, and tax disclosures.",
          position: { x: 250, y: 180 },
        },
        {
          id: `node-${now}-3`,
          type: "task",
          label: "IT Hardware & Cloud Account Setup",
          role: "IT Operations",
          sla: "24 hours",
          description: "Provision laptop workstation, Google Workspace, and SSO credentials.",
          position: { x: 250, y: 310 },
        },
        {
          id: `node-${now}-4`,
          type: "approval",
          label: "Security Clearance & Access Gate",
          role: "Security Officer",
          sla: "4 hours",
          description: "Sign-off required for production database and repo access.",
          position: { x: 250, y: 440 },
        },
        {
          id: `node-${now}-5`,
          type: "task",
          label: "Day 1 Company Orientation",
          role: "HR Lead",
          sla: "Full day",
          description: "Welcome session, benefits review, and company culture walkthrough.",
          position: { x: 250, y: 570 },
        },
        {
          id: `node-${now}-6`,
          type: "task",
          label: "Team Mentorship & 14-Day Check-in",
          role: "Senior Mentor",
          sla: "2 weeks",
          description: "Pair programming, milestone tracking, and initial KPI alignment.",
          position: { x: 250, y: 700 },
        },
        {
          id: `node-${now}-7`,
          type: "end",
          label: "Onboarding Completed & Confirmed",
          role: "Department Head",
          description: "Probation roadmap validated and employee active in HRIS.",
          position: { x: 250, y: 830 },
        },
      ];

      for (let i = 0; i < initialNodes.length - 1; i++) {
        initialEdges.push({
          id: `e-${initialNodes[i].id}-${initialNodes[i + 1].id}`,
          source: initialNodes[i].id,
          target: initialNodes[i + 1].id,
        });
      }

      initialParticipants = [
        { name: ownerName || "Alex Morgan", role: "Owner / Lead", email: ownerEmail },
        { name: "Jessica Wong", role: "HR Coordinator", email: "j.wong@acme.com" },
        { name: "Kevin Taylor", role: "IT Ops Lead", email: "k.taylor@acme.com" },
        { name: "Amanda Brooks", role: "VP People", email: "a.brooks@acme.com" },
      ];
    } else if (templateId === "procure-to-pay") {
      initialNodes = [
        {
          id: `node-${now}-1`,
          type: "start",
          label: "Purchase Requisition Submitted",
          role: "Department Requester",
          description: "Team member creates purchase request with quotes and justification.",
          position: { x: 250, y: 50 },
        },
        {
          id: `node-${now}-2`,
          type: "approval",
          label: "Budget & Department Head Sign-off",
          role: "Department Head",
          sla: "8 hours",
          description: "Verify project budget allocation and approve requisition.",
          position: { x: 250, y: 180 },
        },
        {
          id: `node-${now}-3`,
          type: "decision",
          label: "Vendor Compliance & SOC2 Check",
          role: "Procurement Lead",
          condition: "Spend > $25,000",
          sla: "24 hours",
          description: "Evaluate vendor NDA, tax registration, and security posture.",
          position: { x: 250, y: 310 },
        },
        {
          id: `node-${now}-4`,
          type: "task",
          label: "Purchase Order Issued to Vendor",
          role: "Procurement Specialist",
          sla: "4 hours",
          description: "Generate binding PO document and deliver to vendor sales desk.",
          position: { x: 250, y: 440 },
        },
        {
          id: `node-${now}-5`,
          type: "task",
          label: "Goods Receipt & 3-Way Invoice Match",
          role: "Accounts Payable",
          sla: "24 hours",
          description: "Cross-reference receiving slip, invoice line items, and original PO.",
          position: { x: 250, y: 570 },
        },
        {
          id: `node-${now}-6`,
          type: "end",
          label: "Electronic Remittance & PO Closed",
          role: "Treasury Lead",
          description: "Wire payment cleared and accounting ledger updated.",
          position: { x: 250, y: 700 },
        },
      ];

      for (let i = 0; i < initialNodes.length - 1; i++) {
        initialEdges.push({
          id: `e-${initialNodes[i].id}-${initialNodes[i + 1].id}`,
          source: initialNodes[i].id,
          target: initialNodes[i + 1].id,
        });
      }

      initialParticipants = [
        { name: ownerName || "Alex Morgan", role: "Owner / Lead", email: ownerEmail },
        { name: "Robert Miller", role: "Procurement Director", email: "r.miller@acme.com" },
        { name: "Elena Rostova", role: "AP Controller", email: "e.rostova@acme.com" },
      ];
    } else if (templateId === "contract-review") {
      initialNodes = [
        {
          id: `node-${now}-1`,
          type: "start",
          label: "Draft Contract Requisition",
          role: "Account Executive",
          description: "Submit customer-requested custom terms or MSA redline.",
          position: { x: 250, y: 50 },
        },
        {
          id: `node-${now}-2`,
          type: "task",
          label: "Legal Redlining & Risk Analysis",
          role: "Corporate Counsel",
          sla: "48 hours",
          description: "Evaluate indemnification, liability caps, and jurisdiction clauses.",
          position: { x: 250, y: 180 },
        },
        {
          id: `node-${now}-3`,
          type: "approval",
          label: "Executive Commercial Approval",
          role: "VP Commercial",
          sla: "24 hours",
          description: "Executive approval on uncapped liabilities or payment terms.",
          position: { x: 250, y: 310 },
        },
        {
          id: `node-${now}-4`,
          type: "task",
          label: "DocuSign Envelope Dispatch",
          role: "Legal Operations",
          sla: "12 hours",
          description: "Route final PDF to external signatory via certified e-sign.",
          position: { x: 250, y: 440 },
        },
        {
          id: `node-${now}-5`,
          type: "end",
          label: "Executed Contract Archived",
          role: "Legal Repository Lead",
          description: "Store countersigned agreement in secure enterprise repository.",
          position: { x: 250, y: 570 },
        },
      ];

      for (let i = 0; i < initialNodes.length - 1; i++) {
        initialEdges.push({
          id: `e-${initialNodes[i].id}-${initialNodes[i + 1].id}`,
          source: initialNodes[i].id,
          target: initialNodes[i + 1].id,
        });
      }

      initialParticipants = [
        { name: ownerName || "Alex Morgan", role: "Owner / Lead", email: ownerEmail },
        { name: "Rachel Adams", role: "Senior Legal Counsel", email: "r.adams@acme.com" },
        { name: "Thomas Wright", role: "VP Commercial", email: "t.wright@acme.com" },
      ];
    } else {
      initialNodes = [
        {
          id: `node-${now}-1`,
          type: "start",
          label: `${name} Initiated`,
          role: ownerName || "Process Owner",
          description: description || "Process triggering event.",
          position: { x: 250, y: 50 },
        },
        {
          id: `node-${now}-2`,
          type: "task",
          label: "Initial Execution Step",
          role: ownerName || "Operator",
          description: "Perform initial validation and capture required details.",
          sla: "4 hours",
          required: true,
          position: { x: 250, y: 180 },
        },
        {
          id: `node-${now}-3`,
          type: "end",
          label: `${name} Completed`,
          role: "Process Owner",
          description: "Process completed successfully.",
          position: { x: 250, y: 320 },
        },
      ];

      initialEdges = [
        {
          id: `e-${initialNodes[0].id}-${initialNodes[1].id}`,
          source: initialNodes[0].id,
          target: initialNodes[1].id,
        },
        {
          id: `e-${initialNodes[1].id}-${initialNodes[2].id}`,
          source: initialNodes[1].id,
          target: initialNodes[2].id,
        },
      ];

      initialParticipants = [
        {
          name: ownerName || "Process Owner",
          role: "Owner / Lead",
          email: ownerEmail || null,
        },
      ];
    }

    const process = await prisma.process.create({
      data: {
        organizationId: org.id,
        name: name.trim(),
        description: description?.trim() || null,
        department: department || "Operations",
        ownerName: ownerName || "Process Owner",
        ownerEmail: ownerEmail || null,
        status: "Draft",
        currentVersionNumber: 1,
        participants: {
          create: initialParticipants,
        },
        messages: {
          create: [
            {
              senderType: "AI",
              message: `Welcome to the ${name} workspace! I'm your AI process assistant. Describe what happens in this process, who is involved, and any approval or decision criteria.`,
            },
          ],
        },
      },
    });

    const version = await prisma.processVersion.create({
      data: {
        processId: process.id,
        versionNumber: 1,
        processData: JSON.stringify({
          nodes: initialNodes,
          edges: initialEdges,
        }),
        createdBy: ownerName || "Process Owner",
        changeSummary: templateId
          ? `Pre-mapped template '${name}' initialized`
          : "Initial Process Workspace Created",
      },
    });

    await prisma.process.update({
      where: { id: process.id },
      data: { currentVersionId: version.id },
    });

    const createdProcess = await prisma.process.findUnique({
      where: { id: process.id },
      include: {
        versions: true,
        participants: true,
        messages: true,
      },
    });

    return NextResponse.json({ process: createdProcess }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create process" },
      { status: 500 }
    );
  }
}