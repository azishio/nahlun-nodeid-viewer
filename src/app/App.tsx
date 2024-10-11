"use client";

import {DeckGL} from "@deck.gl/react";
import {BitmapLayer, IconLayer, TileLayer} from "deck.gl";
import {FeatureCollection, LineString} from "geojson";
import {pointToIndex} from "hilbert-curve";

export function App() {

    const layers = [
        new TileLayer({
            id: 'OpenStreetMap',
            data: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
            maxZoom: 18,
            minZoom: 0,

            renderSubLayers: props => {
                const {boundingBox} = props.tile;

                return new BitmapLayer(props, {
                    data: null as unknown as undefined,
                    image: props.data,
                    bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]]
                });
            },
        }),
        new TileLayer({
            id: 'NodeID',
            maxZoom: 16,
            minZoom: 16,
            getTileData: (props) => {
                const {index} = props;
                return fetchNodeData(index);
            },
            pickable: true,

            renderSubLayers: props => {
                const {index} = props.tile;

                return new IconLayer<NodeData>(props, {
                    id: `NodeID-${index.x}-${index.y}-${index.z}`,
                    iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
                    getIcon: (_) => "marker",
                    iconMapping: {
                        "marker": {
                            "x": 0,
                            "y": 0,
                            "width": 128,
                            "height": 128,
                            "anchorY": 128,
                            "mask": true
                        }
                    },
                    getPosition: (d: NodeData) => d.coordinates,
                    getSize: 40,
                    pickable: true,
                });
            },
        }),

    ];

    return (
        <>
            <DeckGL
                initialViewState={
                    {
                        longitude: 139.0192649,
                        latitude: 36.486692,
                        zoom: 16
                    }
                }
                controller
                getTooltip={({object}) => object && `NodeID: ${object.hilbert}\nType: ${object.type}\n Category: ${object.rivCtg}`}
                layers={layers}
            >
            </DeckGL>


        </>

    );
}

function ll2pixel(long: number, lat: number, zoom: number): { x: number, y: number } {
    const L = 85.05112878;

    const long_rad = long * Math.PI / 180;
    const lat_rad = lat * Math.PI / 180;

    const x = Math.pow(2, zoom + 7) * (long_rad / Math.PI + 1);
    const y = (Math.pow(2, zoom + 7) / Math.PI) * (-Math.atanh(Math.sin(lat_rad)) + Math.atanh(Math.sin(L * Math.PI / 180)));

    return {x, y};
}

type FeatureProperties = {
    type: string,
    rivCtg: string,
}

type TileIndex = { x: number, y: number, z: number };

type NodeData = FeatureProperties & { hilbert: number, coordinates: [number, number] };

async function fetchNodeData(index: TileIndex): Promise<NodeData[]> {
    const {x, y, z} = index;
    let fetched = await fetch(`https://cyberjapandata.gsi.go.jp/xyz/experimental_rvrcl/${z}/${x}/${y}.geojson`);

    let fc: FeatureCollection<LineString, FeatureProperties> = await fetched.json();

    return fc.features
        .flatMap((f) => {
            const {type, rivCtg} = f.properties;
            return f.geometry.coordinates.map(([long, lat]) => {
                const pixel = ll2pixel(long, lat, 18);
                // ZoomLv(18) , TileSize(256=2^8) , HilbertOrder(26)
                const hilbert = pointToIndex({x: pixel.x, y: pixel.y}, 26);

                return {type, rivCtg, hilbert, coordinates: [long, lat]};
            })
        });
}
