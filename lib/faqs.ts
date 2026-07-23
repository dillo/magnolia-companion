export type FaqItem = { question: string; answer: string };
export type FaqSection = { title: string; items: FaqItem[] };
export type FeaturedFaq = FaqItem & { section: string };

export function faqSectionId(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        question: "Who do I go to with questions or problems?",
        answer:
          "The Executive Director is the main resource for policies, services, personnel, maintenance, fees, mail, and billing. For health-related matters such as medications, treatments, or doctor appointments, contact the Health & Wellness Director. Problems not resolved by other staff should go to the Executive Director.",
      },
      {
        question: "Who provides day-to-day personal care?",
        answer:
          "Resident Care Partners are available 24 hours a day for dressing, hygiene, bathing, medication assistance, routine health tasks, laundry, and housekeeping support.",
      },
    ],
  },
  {
    title: "Apartment",
    items: [
      {
        question: "Do apartments come furnished?",
        answer:
          "No. Apartments are unfurnished so residents can decorate with their own belongings, and residents coordinate their own move-in. Apartments have private bathrooms and most have kitchenettes. Ask the Executive Director if state rules require any furnishings.",
      },
      {
        question: "Can I make changes to my apartment?",
        answer:
          "Discuss changes with the Executive Director first, including fixtures, appliances, window coverings, flooring, and lock modifications. Residents must reimburse the community for restoring the apartment to its original condition, even if an alteration was approved.",
      },
      {
        question: "Who handles repairs?",
        answer:
          "Notify the Executive Director or Maintenance Director. Residents should not attempt repairs themselves and are responsible for costs from damage or wear beyond normal use.",
      },
      {
        question: "Are utilities included?",
        answer:
          "Basic fees include utilities except telephone, television, and internet. Apartments have phone connections, a community phone is available for free local calls, and cable or internet can be installed if the building is wired for it.",
      },
      {
        question: "What about keys?",
        answer:
          "Keys are issued at move-in. Report lost keys immediately, return keys at move-out, and check the Residency Agreement for replacement costs. The community recommends locking the apartment door whether residents are in or out.",
      },
    ],
  },
  {
    title: "Meals",
    items: [
      {
        question: "How do meals work?",
        answer:
          "Breakfast, lunch, and dinner are served in the main dining room. Staff can remind residents of mealtimes or escort them. Meals follow USDA guidelines and physician dietary orders, with menu help from a registered dietitian. Snacks are available throughout the day.",
      },
      {
        question: "Can meals be delivered to my apartment?",
        answer:
          "Not routinely. Meals may be delivered for up to three consecutive days at no charge when necessary, such as during illness. Ongoing tray service is available as a paid concierge service.",
      },
      {
        question: "Can family eat with me?",
        answer:
          "Yes. Guests are encouraged to dine with residents. Notify the Dining Services Director 24 hours ahead when possible. Guest meals have a nominal charge, paid at the office or added to the monthly bill.",
      },
    ],
  },
  {
    title: "Services and Fees",
    items: [
      {
        question: "What determines my care fees?",
        answer:
          "A comprehensive service assessment is completed at move-in, quarterly, and whenever a resident's condition changes. This creates a personalized Negotiated Service Plan. If service needs change, fee changes take effect immediately without prior notice.",
      },
      {
        question: "What are concierge services?",
        answer:
          "Concierge services are optional pay-per-fee extras such as supplemental nursing, dietitian or pharmacist consultations, tray service, companion services, seasonal deep cleaning, pet care, and medical supplies. Tell the community immediately when an optional service is no longer wanted, or charges may continue.",
      },
      {
        question: "How does billing work?",
        answer:
          "Statements are mailed around the 25th and payment is due on the 1st. Rent paid after the 5th is late and incurs a $250 late fee, or the amount listed in the Residency Agreement.",
      },
      {
        question: "Is housekeeping included?",
        answer:
          "Yes. Weekly cleaning includes bed linens, vacuuming, bathroom and kitchen cleaning, and dusting. Weekly personal laundry and linen service are also included, or residents may use community washers and dryers free with their own supplies. Staff do not hand-launder, iron, or mend.",
      },
      {
        question: "Is transportation provided?",
        answer:
          "The community assists with transportation coordination for medical appointments, shopping, and errands. Contact the Executive Director about arrangements and any fees.",
      },
    ],
  },
  {
    title: "Health and Medications",
    items: [
      {
        question: "How are medications handled?",
        answer:
          "Staff can monitor medications, or residents may self-medicate if allowed under state law. Medications can be filled through the community's preferred pharmacy, which bills residents directly. Using an outside pharmacy adds a monthly charge. Tell staff in advance before being away so medications can be prepared.",
      },
      {
        question: "What is the emergency call system for?",
        answer:
          "Every apartment has an emergency call system. It is for emergencies only, not for help with TV, phone calls, or routine questions.",
      },
    ],
  },
  {
    title: "Safety and Security",
    items: [
      {
        question: "What items are prohibited in my apartment?",
        answer:
          "Prohibited items include firearms, ammunition, weapons, flammables such as gasoline or kerosene, explosives, illegal drugs, space heaters, and other hazardous items. Cleaning chemicals must be secured.",
      },
      {
        question: "What extra restrictions apply in Memory Care?",
        answer:
          "Do not bring knives, scissors, sharp items, shaving razors except electric razors, silverware, household cleaners, alcohol-based mouthwash, hairdryers, curling irons, clothing irons, extension cords, throw rugs, nail polish or remover, or any medications into Memory Care. Give physician-ordered items to staff. Electric appliances need Executive Director approval first.",
      },
      {
        question: "Is smoking allowed?",
        answer:
          "The community is smoke-free, including e-cigarettes and vaping, except in a designated outdoor smoking area. Ask the Executive Director for the location. This rule applies to visitors too.",
      },
      {
        question: "What happens in an emergency or disaster?",
        answer:
          "The community has an emergency preparedness plan available on request and will arrange evacuation, lodging, and care if needed. Fire drills are held as required by state law, and participation is encouraged and sometimes required.",
      },
    ],
  },
  {
    title: "Visitors and Daily Life",
    items: [
      {
        question: "Can I have guests?",
        answer:
          "Yes. Guests are encouraged and may visit anytime. Visitors must sign in and out at the front. Arrange overnight guests with the Executive Director. The community may ask disruptive visitors to leave.",
      },
      {
        question: "What if I leave the community temporarily?",
        answer:
          "Use the sign-out and sign-in sheet at the front whenever leaving. For overnight or longer absences, notify the Executive Director and Wellness Director. During hospitalizations or temporary absences, the apartment is held, but all fees continue unless state regulations say otherwise.",
      },
      {
        question: "Can I have a pet?",
        answer:
          "Cats, small dogs, and birds are welcome under community policy. Residents are responsible for care, supervision, cleanup, immunization records, spay or neuter status, and liability for damage. Dogs must be leashed in common areas. Only designated support pets are allowed in the dining room.",
      },
      {
        question: "Is there parking, a salon, or newspaper delivery?",
        answer:
          "Parking is limited, so ask the Executive Director about availability. A beauty and barber salon operates on site with fees and posted hours. Newspaper delivery can be arranged for pickup at reception or delivery to the apartment.",
      },
      {
        question: "Can staff enter my apartment?",
        answer:
          "Yes, at reasonable times and for reasonable purposes such as housekeeping, maintenance, or emergencies. The community tries to give notice except in emergencies. State licensing agency representatives may inspect at any time without advance notice.",
      },
    ],
  },
  {
    title: "Rights, Privacy, and Complaints",
    items: [
      {
        question: "How do I file a complaint?",
        answer:
          "Residents can join the Resident Council, speak with or schedule a meeting with the Executive Director, submit a written complaint, or follow state grievance rules. If still unsatisfied, contact the Pegasus Senior Living VP of Operations at 611 S Main Street Suite 400, Grapevine, TX 76051, or 1-877-561-7262. Anonymous complaints are accepted. Residents may also contact the state Ombudsman or licensing agency. Retaliation for complaints is not allowed.",
      },
      {
        question: "Are my records confidential?",
        answer:
          "Yes. Business and health records are confidential, though licensing and government agencies may examine them without notice. The Authorization/Consent form signed at move-in governs releases to others. Residents or legal representatives can request copies of records.",
      },
      {
        question: "Can I install a camera or monitoring device in the apartment?",
        answer:
          "Only if state regulations allow it and only after written notification through the Electronic Monitoring Device Form. Restrictions apply: no placement viewing toileting, bathing, or common hallways, a notice sign must be posted on the door, and it is not allowed with unrelated roommates or when a resident cannot give informed consent. Only the resident or someone holding power of attorney or guardianship may install one.",
      },
      {
        question: "Is my property insured by the community?",
        answer:
          "No. The community is not an insurer of residents or property and is not responsible for loss or damage unless grossly negligent. Do not keep large sums of money or valuables in the apartment. Personal property insurance is strongly recommended.",
      },
    ],
  },
];

const FEATURED_QUESTIONS = new Set([
  "Who do I go to with questions or problems?",
  "Who provides day-to-day personal care?",
  "Who handles repairs?",
  "Are utilities included?",
  "What about keys?",
  "How do meals work?",
  "Can meals be delivered to my apartment?",
  "Can family eat with me?",
  "Is housekeeping included?",
  "Is transportation provided?",
  "What is the emergency call system for?",
  "Can I have guests?",
  "What if I leave the community temporarily?",
  "Can I have a pet?",
  "Is there parking, a salon, or newspaper delivery?",
]);

export const FEATURED_FAQS: FeaturedFaq[] = FAQ_SECTIONS.flatMap((section) =>
  section.items
    .filter((item) => FEATURED_QUESTIONS.has(item.question))
    .map((item) => ({ ...item, section: section.title })),
);
