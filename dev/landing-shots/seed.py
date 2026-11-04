"""One night at an example shop, on backend.sh's throwaway database: the same customers as
the landing page's night (NightStory.vue). Every figure on the screenshots comes from here."""

import asyncio
from datetime import UTC, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from sqlalchemy import delete, select

from heydesk.config import Settings
from heydesk.db import make_engine, use_secrets_key
from heydesk.desks.shop.models import ProductRow, ShopOrder
from heydesk.models.agent import Agent
from heydesk.models.channel import Channel
from heydesk.models.conversation import Conversation
from heydesk.models.document import Document
from heydesk.models.payment_account import PaymentAccount
from heydesk.models.lead import Lead
from heydesk.models.ticket import Ticket
from heydesk.models.turn import Turn

ZONE = ZoneInfo("Asia/Dhaka")
TODAY = datetime.now(ZONE).date()


def at(day: int, hour: int, minute: int) -> datetime:
    local = datetime.combine(TODAY + timedelta(days=day), time(hour, minute), ZONE)
    return local.astimezone(UTC)


def chat(*pairs):
    return [{"role": role, "content": text} for role, text in pairs]


U, A = "user", "assistant"

# name, channel, phone, day, hour, minute, status, lines
CHATS = {
    "sabbir": ("Sabbir Hossain", "messenger", "01700-000114", 0, 0, 41, "active", chat(
        (U, "Cotton panjabi L size white ache?"),
        (A, "Ji, Cotton Panjabi L size White ache, ar matro 3 ta baki. Dam ৳1,850. Kothay pathabo?"),
        (U, "Mirpur 10, Dhaka. Ami Sabbir, 01700-000114"),
        (A, "Thik ache. 1 ta Cotton Panjabi, L, White ৳1,850, Mirpur 10 e delivery ৳60, mot ৳1,910, cash on delivery. Order ta confirm korbo?"),
        (U, "Ji, korun"),
        (A, "Order O-114 confirmed, Sabbir bhai. 1 theke 2 diner moddhe pouche jabe. Dhonnobad."),
    )),
    "mim": ("Mim Akter", "web", "01700-000115", 0, 1, 18, "active", chat(
        (U, "কালো কুর্তি M সাইজ আছে? দুইটা নিব"),
        (A, "জি, Cotton Kurti কালো M সাইজ আছে। দুইটা ৳১,৯০০। কোথায় পাঠাব?"),
        (U, "ধানমন্ডি ২৭, ঢাকা। মিম, 01700-000115"),
        (A, "ঠিক আছে। ২টা Cotton Kurti, M, কালো ৳১,৯০০, ধানমন্ডিতে ডেলিভারি ৳৬০, মোট ৳১,৯৬০, ক্যাশ অন ডেলিভারি। অর্ডারটা কনফার্ম করব?"),
        (U, "হ্যাঁ"),
        (A, "অর্ডার O-115 কনফার্ম হয়েছে। ধন্যবাদ।"),
    )),
    "nusrat": ("Nusrat Jahan", "whatsapp", "01700-000116", 0, 1, 52, "active", chat(
        (U, "Delivery charge koto Sylhet e?"),
        (A, "Sylhet e delivery ৳120, 3 theke 5 din lage. Delivery charge ta age bKash ba Nagad e dite hobe."),
        (U, "Lawn three piece peach ta nibo. Zindabazar, Sylhet. Nusrat, 01700-000116"),
        (A, "1 ta Lawn Three-Piece, Peach ৳2,450, delivery ৳120, mot ৳2,570. Delivery charge ৳120 age, baki ৳2,450 rider ke. Thik ache?"),
        (U, "Ji"),
        (A, "Order O-116 er payment link pathalam."),
        (U, "Pay korlam"),
        (A, "Payment peyechi. Order O-116 confirmed, Nusrat apu."),
    )),
    "tanvir": ("Tanvir Islam", "whatsapp", "01700-000121", 0, 2, 21, "needs_human", chat(
        (U, "Jamdani saree ache? Ma er jonno gift"),
        (A, "Jamdani Saree ৳6,500, Narayanganj er hate bona, Off-white ar Red. Ekhon stock e nei."),
        (U, "Kobe ashbe? Ar blouse ta ki maap moto banano jabe?"),
        (A, "Eta amader team bhalo bolte parbe. Ami janiye dilam, keu apnake 01700-000121 e call korbe."),
    )),
    "rafi": ("Rafi Ahmed", "messenger", None, 0, 3, 5, "active", chat(
        (U, "Chattogram e cash on delivery hobe?"),
        (A, "Chattogram e delivery ৳120, 3 theke 5 din. Delivery charge ta age dite hobe, baki taka rider ke dilei hobe."),
        (U, "Ok thanks"),
    )),
    "mehedi": ("Mehedi Hasan", "web", None, 0, 6, 12, "active", chat(
        (U, "Do you have the silk panjabi in gold, size L?"),
        (A, "Yes, the Silk Panjabi comes in Gold, size L, for ৳3,200. Only 2 left. Would you like to order one?"),
        (U, "Maybe after Friday. Thanks!"),
    )),
    "arif": ("Arif Khan", "telegram", "01700-000117", 0, 6, 52, "active", chat(
        (U, "Baccha r boro r jonno panjabi lagbe. 6-7y white ar M white"),
        (A, "1 ta Kids Panjabi, 6-7y, White ৳890 ar 1 ta Cotton Panjabi, M, White ৳1,850. Uttara, Dhaka te delivery ৳60, mot ৳2,800. Thik ache?"),
        (U, "Ha thik ache"),
        (A, "Order O-117 confirmed. Dhonnobad."),
    )),
    "sadia": ("Sadia Sultana", "messenger", None, 0, 7, 24, "active", chat(
        (U, "আজ অর্ডার করলে কবে পাব? মিরপুর"),
        (A, "মিরপুরে ১ থেকে ২ দিনে পৌঁছে যাবে। বিকাল ৫টার আগে অর্ডার করলে সাধারণত আজই পাঠানো হয়।"),
    )),
    "lamia": ("Lamia Chowdhury", "web", "01700-000118", 0, 7, 36, "active", chat(
        (U, "Silk panjabi maroon M, Gazipur e pathaben?"),
        (A, "Ji. 1 ta Silk Panjabi, M, Maroon ৳3,200, Gazipur e delivery ৳100, mot ৳3,300, cash on delivery. Order ta confirm korbo?"),
        (U, "Yes please"),
        (A, "Order O-118 confirmed, thank you."),
    )),
    "farzana": ("Farzana Rahman", "telegram", "01700-000122", 0, 7, 48, "active", chat(
        (U, "Kurti ta size e choto hoyeche. Exchange kora jabe?"),
        (A, "Ji, delivery r 3 diner moddhe tag soho exchange kora jay. Kon size lagbe bolben?"),
        (U, "L. Ami 3 din age peyechi"),
        (A, "Exchange er request ta rekhechi, team apnake janabe."),
    )),
}


def line(code, name, price, quantity=1, size="", colour=""):
    return {"code": code, "name": name, "size": size, "colour": colour, "quantity": quantity, "price": price}


ORDERS = [
    # number, chat, status, lines, delivery, zone, address, paid
    (114, "sabbir", "new", [line("panjabi-cotton", "Cotton Panjabi", 185000, 1, "L", "White")], 6000, "Inside Dhaka", "Mirpur 10, Dhaka", 0),
    (115, "mim", "new", [line("kurti", "Cotton Kurti", 95000, 2, "M", "Black")], 6000, "Inside Dhaka", "Road 27, Dhanmondi, Dhaka", 0),
    (116, "nusrat", "confirmed", [line("three-piece", "Lawn Three-Piece", 245000, 1, "", "Peach")], 12000, "Outside Dhaka", "Zindabazar, Sylhet", 12000),
    (117, "arif", "new", [line("kids-panjabi", "Kids Panjabi", 89000, 1, "6-7y", "White"), line("panjabi-cotton", "Cotton Panjabi", 185000, 1, "M", "White")], 6000, "Inside Dhaka", "Sector 7, Uttara, Dhaka", 0),
    (118, "lamia", "new", [line("panjabi-silk", "Silk Panjabi", 320000, 1, "M", "Maroon")], 10000, "Dhaka suburbs", "Tongi, Gazipur", 0),
]

# Yesterday's, already moving: the Inbox's All list.
EARLIER = [
    (110, "Shuvo Das", "01700-000110", "shipped", [line("panjabi-cotton", "Cotton Panjabi", 185000, 1, "XL", "White")], 6000, "Inside Dhaka", "Mohakhali, Dhaka", at(-1, 11, 8)),
    (111, "Ritu Paul", "01700-000111", "new", [line("three-piece", "Lawn Three-Piece", 245000, 1, "", "Mint")], 6000, "Inside Dhaka", "Bashundhara, Dhaka", at(-1, 21, 14)),
    (112, "Imran Kabir", "01700-000112", "new", [line("kurti", "Cotton Kurti", 95000, 1, "L", "Mustard")], 12000, "Outside Dhaka", "Agrabad, Chattogram", at(-1, 22, 40)),
    (113, "Tania Ferdous", "01700-000113", "new", [line("kids-panjabi", "Kids Panjabi", 89000, 2, "4-5y", "Sky Blue")], 10000, "Dhaka suburbs", "Fatullah, Narayanganj", at(-1, 23, 47)),
]

# A flat drawing for each product: there are no real photographs of a made-up shop.
SHAPES = {
    "tunic": '<path d="M74 34c6 7 12 10 26 10s20-3 26-10l30 13 18 58-22 7-11-30v102H59V82l-11 30-22-7 18-58z" fill="{c}"/><path d="M100 44v48" stroke="{d}" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="60" r="2.6" fill="{d}"/><circle cx="100" cy="74" r="2.6" fill="{d}"/>',
    "kurti": '<path d="M78 34c5 12 13 16 22 16s17-4 22-16l24 10 12 42-18 6-8-22 18 108H50l18-108-8 22-18-6 12-42z" fill="{c}"/><path d="M62 150h76M58 164h84" stroke="{d}" stroke-width="4"/>',
    "cloth": '<rect x="38" y="52" width="124" height="34" rx="8" fill="{d}"/><rect x="30" y="84" width="140" height="34" rx="8" fill="{c}"/><rect x="38" y="116" width="124" height="34" rx="8" fill="{d}"/><path d="M42 134h116" stroke="{c}" stroke-width="4" stroke-dasharray="6 7"/>',
    "saree": '<path d="M44 46h112v108H44z" fill="{c}"/><path d="M44 46h26v108H44z" fill="{d}"/><g fill="{d}"><circle cx="96" cy="72" r="4"/><circle cx="128" cy="72" r="4"/><circle cx="112" cy="100" r="4"/><circle cx="96" cy="128" r="4"/><circle cx="128" cy="128" r="4"/></g>',
}
PHOTOS = {
    "panjabi-cotton": ("tunic", "#f2efe6", "#dfe6ee", "#8f8b7c"),
    "panjabi-silk": ("tunic", "#f3e4e1", "#7b1f2e", "#d9a441"),
    "three-piece": ("cloth", "#e6f2ec", "#f2b8a0", "#7fc4a6"),
    "jamdani-saree": ("saree", "#f4eedd", "#fbf8ef", "#b4532a"),
    "kurti": ("kurti", "#ece9e2", "#26262a", "#d9a441"),
    "kids-panjabi": ("tunic", "#e3effa", "#a9d0ef", "#ffffff"),
}


async def main() -> None:
    settings = Settings()
    use_secrets_key(settings.secrets_key)
    media = Path(settings.MEDIA_DIR) / "demo"
    media.mkdir(parents=True, exist_ok=True)
    engine, sessions = make_engine(settings.DATABASE_URL)
    async with sessions() as s, s.begin():
        agent = await s.scalar(select(Agent))
        ws = agent.workspace_id
        # The business's name and an address, so nothing is left to set up.
        agent.config = {
            **agent.config,
            "address": "House 12, Road 5, Mirpur 11, Dhaka",
            "hours": agent.config.get("hours") or {},
        }

        for model in (Turn, ShopOrder, Ticket, Lead, Channel, Document, PaymentAccount, Conversation):
            await s.execute(delete(model))

        for code, (shape, ground, colour, detail) in PHOTOS.items():
            body = SHAPES[shape].format(c=colour, d=detail)
            svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="{ground}"/>{body}</svg>'
            (media / f"{code}.svg").write_text(svg)
            row = await s.scalar(select(ProductRow).where(ProductRow.code == code))
            row.photos = [f"/media/demo/{code}.svg"]

        for kind, address in (("telegram", "nakshithreads_bot"), ("whatsapp", "880170000000"), ("messenger", "nakshi.threads")):
            s.add(Channel(workspace_id=ws, agent_id=agent.id, kind=kind, token="example", secret="example", address=address))

        s.add(PaymentAccount(workspace_id=ws, provider="sslcommerz", store_id="example", password="example", sandbox=True))
        for title in ("Exchange policy", "Size guide"):
            s.add(Document(workspace_id=ws, agent_id=agent.id, title=title, filename=f"{title}.pdf", kind="pdf", text=title, chunk_count=1))

        convs = {}
        for key, (name, channel, phone, day, hour, minute, status, messages) in CHATS.items():
            when = at(day, hour, minute)
            start = when - timedelta(minutes=2 * len(messages))
            conv = Conversation(
                workspace_id=ws, agent_id=agent.id, channel=channel, contact=key, name=name,
                status=status, messages=messages, created_at=start, updated_at=when,
            )
            s.add(conv)
            await s.flush()
            convs[key] = conv
            for i, m in enumerate(messages):
                if m["role"] == A:
                    s.add(Turn(
                        workspace_id=ws, conversation_id=conv.id, channel=channel, llm="fake",
                        at=start + timedelta(minutes=2 * i), total_ms=1400, first_output_ms=500,
                        input_tokens=1, output_tokens=1, cost_micros=0, tools=[], handed_off=status == "needs_human",
                        interrupted=False,
                    ))

        for number, key, status, lines, delivery, zone, address, paid in ORDERS:
            name, _, phone, day, hour, minute, *_ = CHATS[key]
            subtotal = sum(x["price"] * x["quantity"] for x in lines)
            when = at(day, hour, minute)
            s.add(ShopOrder(
                workspace_id=ws, conversation_id=convs[key].id, number=number, status=status, name=name, phone=phone,
                currency="BDT", paid=paid, lines=lines, subtotal=subtotal, delivery_charge=delivery,
                total=subtotal + delivery, zone=zone, address=address, created_at=when, updated_at=when,
            ))
        for number, name, phone, status, lines, delivery, zone, address, when in EARLIER:
            subtotal = sum(x["price"] * x["quantity"] for x in lines)
            s.add(ShopOrder(
                workspace_id=ws, conversation_id=None, number=number, status=status, name=name, phone=phone,
                currency="BDT", lines=lines, subtotal=subtotal, delivery_charge=delivery,
                total=subtotal + delivery, zone=zone, address=address, created_at=when, updated_at=when,
            ))

        # The exchange that waits for a person.
        s.add(Ticket(
            workspace_id=ws, conversation_id=convs["farzana"].id, number=101, status="open",
            name="Farzana Rahman", phone="01700-000122", reason="Kurti too small: wants an exchange for size L.",
            created_at=at(0, 7, 48), updated_at=at(0, 7, 48),
        ))
    await engine.dispose()
    print("seeded", TODAY)


asyncio.run(main())
