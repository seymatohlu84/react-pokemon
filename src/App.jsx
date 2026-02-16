import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Pagination,
  Stack,
  Typography,
  Chip,
  Divider,
} from "@mui/material";

const PLACEHOLDER_IMG =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";

const API_BASE = "https://pokeapi.co/api/v2";
const PAGE_SIZE = 20;

function getIdFromUrl(url) {
  // Örn: https://pokeapi.co/api/v2/pokemon/25/  => 25
  const trimmed = url.endsWith("/") ? url.slice(0, -1) : url;
  return trimmed.split("/").pop();
}

export default function App() {
  // Liste state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  // Dialog state
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const totalPages = useMemo(() => {
    return totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;
  }, [totalCount]);

  // 1) Listeyi çek
  useEffect(() => {
    let cancelled = false;

    async function fetchList() {
      setListLoading(true);
      setListError("");

      const offset = (page - 1) * PAGE_SIZE;
      const url = `${API_BASE}/pokemon?limit=${PAGE_SIZE}&offset=${offset}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Liste isteği başarısız: ${res.status}`);
        const data = await res.json();

        if (cancelled) return;
        setTotalCount(data.count || 0);
        setItems(data.results || []);
      } catch (err) {
        if (cancelled) return;
        setListError(err.message || "Liste çekilemedi.");
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }

    fetchList();

    return () => {
      cancelled = true;
    };
  }, [page]);

  // 2) Detayı çek (dialog açılınca)
  async function openDetail(name) {
    setOpen(true);
    setSelectedName(name);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const res = await fetch(`${API_BASE}/pokemon/${name}`);
      if (!res.ok) throw new Error(`Detay isteği başarısız: ${res.status}`);
      const data = await res.json();
      setDetail(data);
    } catch (err) {
      setDetailError(err.message || "Detay çekilemedi.");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setOpen(false);
    setSelectedName("");
    setDetail(null);
    setDetailError("");
    setDetailLoading(false);
  }

  return (
    <>
      <CssBaseline />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            Pokémon Listesi
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Sayfa: {page}
            {totalPages ? ` / ${totalPages}` : ""}
          </Typography>
        </Stack>

        {listLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!listLoading && listError && (
          <Box sx={{ py: 3 }}>
            <Typography color="error" fontWeight={600}>
              Hata:
            </Typography>
            <Typography color="error">{listError}</Typography>
          </Box>
        )}

        {!listLoading && !listError && (
          <>
            <Grid container spacing={2}>
              {items.map((p) => {
                const id = getIdFromUrl(p.url);

                // Önce official-artwork dene
                const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={p.name}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardActionArea
                        sx={{ height: "100%" }}
                        onClick={() => openDetail(p.name)}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: 140,
                            bgcolor: "background.default",
                          }}
                        >
                          <img
                            src={spriteUrl}
                            alt={p.name}
                            width={96}
                            height={96}
                            loading="lazy"
                            onError={(e) => {
                              const img = e.currentTarget;

                              // 1) official-artwork yoksa -> normal sprite
                              if (!img.dataset.triedSprite) {
                                img.dataset.triedSprite = "1";
                                img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
                                return;
                              }

                              // 2) o da yoksa -> placeholder
                              if (!img.dataset.triedPlaceholder) {
                                img.dataset.triedPlaceholder = "1";
                                img.src = PLACEHOLDER_IMG;
                                return;
                              }

                              // 3) placeholder bile olmazsa -> gizle
                              img.style.display = "none";
                            }}
                          />
                        </Box>

                        <CardContent>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {p.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {id}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                shape="rounded"
              />
            </Box>
          </>
        )}

        {/* DETAY DIALOG */}
        <Dialog open={open} onClose={closeDetail} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {selectedName || "Detay"}
          </DialogTitle>

          <DialogContent dividers>
            {detailLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            )}

            {!detailLoading && detailError && (
              <Box>
                <Typography color="error" fontWeight={600}>
                  Hata:
                </Typography>
                <Typography color="error">{detailError}</Typography>
              </Box>
            )}

            {!detailLoading && !detailError && detail && (
              <Stack spacing={2}>
                {/* Görsel */}
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <img
                    src={
                      detail?.sprites?.other?.["official-artwork"]?.front_default ||
                      detail?.sprites?.other?.home?.front_default ||
                      detail?.sprites?.other?.dream_world?.front_default ||
                      detail?.sprites?.front_default ||
                      PLACEHOLDER_IMG
                    }
                    alt={detail.name}
                    style={{ width: 220, height: 220, objectFit: "contain" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </Box>

                <Divider />

                {/* Tipler */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {(detail.types || []).map((t) => (
                    <Chip
                      key={t.type.name}
                      label={t.type.name}
                      variant="outlined"
                    />
                  ))}
                </Stack>

                {/* Boy / Kilo */}
                <Stack direction="row" spacing={2}>
                  <Typography>
                    <b>Height:</b> {detail.height}
                  </Typography>
                  <Typography>
                    <b>Weight:</b> {detail.weight}
                  </Typography>
                </Stack>

                {/* Statlar */}
                <Box>
                  <Typography fontWeight={800} sx={{ mb: 1 }}>
                    Stats
                  </Typography>

                  <Stack spacing={1}>
                    {(detail.stats || []).map((s) => (
                      <Box
                        key={s.stat.name}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textTransform: "capitalize" }}
                        >
                          {s.stat.name}
                        </Typography>

                        <Typography variant="body2" fontWeight={700}>
                          {s.base_stat}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </>
  );
}
