# Horizon OCI | Strategic Architectural Copilot

**Horizon OCI** is a high-intelligence dashboard designed for OCI Architects and Cloud Enterprise Leads. It bridges the gap between official OCI release roadmaps and actual customer consumption data.

## 🔗 Repository
**Official Home:** [https://github.com/BfShaik/OCIHorizon.git](https://github.com/BfShaik/OCIHorizon.git)

---

## 🚀 The Core Problem
Oracle Cloud Infrastructure (OCI) releases hundreds of updates monthly. For a Large Enterprise, manually identifying which "New Feature" or "Patch" impacts their specific fleet of SKUs is a time-consuming manual task. **Horizon OCI automates this matching via Semantic Architectural Reasoning.**

## 🧠 Intelligence Specifications

### 1. Grounded Roadmap Scraping
Horizon does not rely on outdated training data. It utilizes **Gemini 3 Pro with Google Search Grounding** to live-scrape `docs.oracle.com/en-us/iaas/releasenotes/`. 
- **Filter Logic:** The engine distills your SKU list into core service keywords (e.g., *Autonomous Database, Compute, Block Storage*) to focus the search.

### 2. Semantic SKU Matching
The app uses **Gemini 3 Flash** to perform correlation between a consumption line item and a release note.
- **Example:** If you use "E4 OCPUs" and a release note mentions "E5 Flexible Shapes," the AI recognizes the architectural upgrade path and assigns a high **Match Score**.
- **Threshold:** Only updates with a match score > 50% are prioritized in the Intelligence Stream.

### 3. Strategic Pillars
Insights are synthesized into four architectural pillars:
- **Optimization:** Identifying shape upgrades or performance improvements.
- **Security:** Matching CVE updates or identity service changes to active footprints.
- **Cost:** Highlighting new shapes or pricing models that reduce existing spend.
- **Growth:** Suggesting complementary services for existing workloads.

---

## 🛠️ Technical Stack
- **Framework:** React 19 (Hooks-based state management)
- **Styling:** Tailwind CSS (Modern "Command Center" aesthetic with Dark Mode)
- **AI Engine:** OCI Generative AI (Google Gemini models hosted on OCI)
  - *google.gemini-2.5-pro:* Research & Search Grounding via OCI
  - *google.gemini-2.5-flash:* High-speed JSON structuring & Synthesis via OCI
- **Data Ingestion:** PapaParse (Client-side CSV processing)
- **Data Viz:** Recharts (Cost Spectrum Mapping)

---

## 📐 Functional Specs & Navigation

### 🎯 Command Center
- **High-Level Overview:** Visualization of top 5 cost-intensive SKUs.
- **Pillar Cards:** AI-generated strategic actions with "Execute Pivot" capabilities.
- **Live Signals:** A ticker of the most recent highly-relevant roadmap updates.

### 📋 SKU Inventory
- **Immediate Feedback:** Parses 1000+ line items instantly using local browser resources.
- **Product Normalization:** Automatically cleanses OCI SKU descriptions for AI processing.

### 🚀 Intelligence Stream
- **Match Scoring:** Every update is tagged with its relevance to the customer's specific tenant.
- **Direct Sourcing:** Every note is hyperlinked to official documentation for architectural verification.

### 📧 Briefing Pipeline
- **Executive Synthesis:** Converts complex technical matches into business value propositions.
- **HTML Digest:** Generates professional HTML-formatted emails for stakeholders.

---

## ⚙️ Setup & Deployment
1. Configure OCI environment variables in `.env.local`:
   ```bash
   OCI_GENAI_API_KEY=your-oci-api-key-here
   OCI_COMPARTMENT_ID=your-compartment-ocid-here
   ```
2. The app uses OCI Generative AI with Google Gemini models hosted on OCI infrastructure.
3. To initialize the repository:
```bash
git init
git add .
git commit -m "Initial commit: Horizon OCI Strategic Advisor"
git remote add origin https://github.com/BfShaik/OCIHorizon.git
git push -u origin main
```
