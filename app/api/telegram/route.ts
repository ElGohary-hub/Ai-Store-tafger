import { NextResponse } from 'next/server';
import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

bot.command('start', (ctx) => {
    const userId = ctx.from.id;
    const name = ctx.from.first_name;
    
    ctx.reply(`👋 مرحباً بك في المتجر يا ${name}!\n\n🆔 الأيدي: ${userId}\n💵 الرصيد: $0.00`, Markup.inlineKeyboard([
        [Markup.button.callback('المنتجات 🛍', 'menu_products')],
        [Markup.button.callback('المحفظة 💰', 'menu_wallet')]
    ]));
});

bot.action('menu_products', async (ctx) => {
    try {
        // سحب كل المنتجات بدون الفلترة بكلمة stock
        const products = await prisma.product.findMany(); 

        let buttons = [];
        
        for (let i = 0; i < products.length; i += 2) {
            let row = [];
            // عرض اسم المنتج فقط بدون رقم المخزون
            row.push(Markup.button.callback(products[i].name, `prod_${products[i].id}`));
            
            if (products[i+1]) {
                row.push(Markup.button.callback(products[i+1].name, `prod_${products[i+1].id}`));
            }
            buttons.push(row);
        }
        
        buttons.push([Markup.button.callback('🔙 القائمة الرئيسية', 'main_menu')]);

        await ctx.editMessageText(`اختر تطبيقاً لعرض باقاته:`, Markup.inlineKeyboard(buttons));
    } catch (error) {
        console.error("Error fetching products:", error);
        ctx.reply("حدث خطأ أثناء جلب المنتجات. جرب مرة أخرى.");
    }
});

bot.action('main_menu', (ctx) => {
    const userId = ctx.from?.id;
    const name = ctx.from?.first_name;
    ctx.editMessageText(`👋 مرحباً بك في المتجر يا ${name}!\n\n🆔 الأيدي: ${userId}\n💵 الرصيد: $0.00`, Markup.inlineKeyboard([
        [Markup.button.callback('المنتجات 🛍', 'menu_products')],
        [Markup.button.callback('المحفظة 💰', 'menu_wallet')]
    ]));
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        await bot.handleUpdate(body);
        return NextResponse.json({ status: 'Success' });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ status: 'Error' }, { status: 500 });
    }
}
