import Link from "next/link";
import type { HistoryRow } from "@/shared/api/types";
import { GAME_NAMES } from "@/shared/lib/labels";
import { Badge } from "@/shared/ui/badge";
import { Table, Td, Th, THead, Tr } from "@/shared/ui/table";

export function HistoryTable({ rows, withTeam = true }: { rows: HistoryRow[]; withTeam?: boolean }) {
  return (
    <Table minWidth={620} label="История турниров">
      <THead>
        <Th sticky>Турнир</Th>
        <Th>Игра</Th>
        <Th>Результат</Th>
        {withTeam && <Th>Команда</Th>}
        <Th>Дата</Th>
      </THead>
      <tbody>
        {rows.map((r) => (
          <Tr key={r.tournament}>
            <Td sticky className="font-semibold">
              <Link href={`/tournaments/${r.tournamentSlug}`} className="hover:text-accent-hover">
                {r.tournament}
              </Link>
            </Td>
            <Td className="text-text-2">{GAME_NAMES[r.game]}</Td>
            <Td>
              <Badge tone={r.resultTone === "violet" ? "violet-solid" : r.resultTone}>{r.result}</Badge>
            </Td>
            {withTeam && <Td>{r.team}</Td>}
            <Td className="mono">{r.date}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
